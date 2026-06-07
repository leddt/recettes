import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  recipeDetailValidator,
  recipeDraftValidator,
  recipeListItemValidator,
} from "./lib/recipeValidators";
import {
  clearCookingProgress,
  clearStepCookingProgress,
  hasCookingProgress,
  setIngredientCheckedAtIndex,
  setStepCheckedAtIndex,
} from "./lib/recipeCookingProgress";
import { buildRecipeSearchText } from "./lib/recipeSearchText";
import { requireAuthUserId } from "./lib/requireAuth";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

function validateRecipeDraft(args: {
  name: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  steps: Array<{ text: string }>;
}) {
  const name = args.name.trim();
  if (name.length === 0) {
    throw new Error("Le nom de la recette est obligatoire.");
  }

  const ingredients = args.ingredients.filter(
    (ingredient) => ingredient.name.trim().length > 0,
  );
  if (ingredients.length === 0) {
    throw new Error("Ajoutez au moins un ingrédient.");
  }

  const steps = args.steps.filter((step) => step.text.trim().length > 0);
  if (steps.length === 0) {
    throw new Error("Ajoutez au moins une étape.");
  }

  return { name, ingredients, steps };
}

type RecipeDraftInput = {
  name: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  steps: Array<{ text: string }>;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  notes?: string;
  tags: string[];
};

function normalizeRecipeDraft(args: RecipeDraftInput) {
  const { name, ingredients, steps } = validateRecipeDraft(args);
  const normalizedIngredients = ingredients.map((ingredient) => ({
    name: ingredient.name.trim(),
    quantity: ingredient.quantity?.trim() || undefined,
    unit: ingredient.unit?.trim() || undefined,
  }));
  const normalizedSteps = steps.map((step) => ({
    text: step.text.trim(),
  }));
  const tags = args.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  const notes = args.notes?.trim() || undefined;
  const searchText = buildRecipeSearchText({
    name,
    notes,
    tags,
    ingredients: normalizedIngredients,
  });

  return {
    name,
    ingredients: normalizedIngredients,
    steps: normalizedSteps,
    servings: args.servings,
    prepTime: args.prepTime,
    cookTime: args.cookTime,
    totalTime: args.totalTime,
    notes,
    tags,
    searchText,
  };
}

async function getRecipeForUser(ctx: QueryCtx | MutationCtx, recipeId: Id<"recipes">) {
  await requireAuthUserId(ctx);
  const recipe = await ctx.db.get("recipes", recipeId);
  if (recipe === null) {
    throw new Error("Recette introuvable.");
  }
  return recipe;
}

async function deleteRecipeCollectionMemberships(
  ctx: MutationCtx,
  recipeId: Id<"recipes">,
) {
  const memberships = await ctx.db
    .query("recipeCollections")
    .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
    .collect();

  for (const membership of memberships) {
    await ctx.db.delete("recipeCollections", membership._id);
  }
}

async function deleteRecipeChatData(ctx: MutationCtx, recipeId: Id<"recipes">) {
  const conversations = await ctx.db
    .query("recipeChatConversations")
    .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
    .collect();

  for (const conversation of conversations) {
    const messages = await ctx.db
      .query("recipeChatMessages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversation._id),
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete("recipeChatMessages", message._id);
    }

    await ctx.db.delete("recipeChatConversations", conversation._id);
  }
}

export const get = query({
  args: { id: v.id("recipes") },
  returns: v.union(recipeDetailValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const recipe = await ctx.db.get("recipes", args.id);
    if (recipe === null) {
      return null;
    }

    const photos = recipe.photos;
    const photoUrls =
      photos && photos.length > 0
        ? await Promise.all(photos.map((photoId) => ctx.storage.getUrl(photoId)))
        : undefined;
    const coverImageUrl = recipe.coverImageId
      ? await ctx.storage.getUrl(recipe.coverImageId)
      : undefined;

    return {
      _id: recipe._id,
      name: recipe.name,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      sourceUrl: recipe.sourceUrl,
      sourceLabel: recipe.sourceLabel,
      photos,
      photoUrls,
      coverImageId: recipe.coverImageId,
      coverImageUrl,
      notes: recipe.notes,
      tags: recipe.tags,
    };
  },
});

export const list = query({
  args: {},
  returns: v.array(recipeListItemValidator),
  handler: async (ctx) => {
    await requireAuthUserId(ctx);

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();

    return Promise.all(
      recipes.map(async (recipe) => ({
        _id: recipe._id,
        name: recipe.name,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.totalTime,
        sourceUrl: recipe.sourceUrl,
        tags: recipe.tags,
        coverImageUrl: recipe.coverImageId
          ? await ctx.storage.getUrl(recipe.coverImageId)
          : undefined,
      })),
    );
  },
});

export const create = mutation({
  args: {
    ...recipeDraftValidator.fields,
    sourceUrl: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
    coverImageId: v.optional(v.id("_storage")),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const photoIds = args.photos ?? [];
    if (args.coverImageId !== undefined) {
      if (photoIds.length > 0 && !photoIds.includes(args.coverImageId)) {
        throw new Error("L'image principale doit faire partie des photos.");
      }
    }

    const normalized = normalizeRecipeDraft(args);
    const now = Date.now();

    const recipeId = await ctx.db.insert("recipes", {
      ...normalized,
      sourceUrl: args.sourceUrl?.trim() || undefined,
      sourceLabel: args.sourceLabel?.trim() || undefined,
      photos: photoIds.length > 0 ? photoIds : undefined,
      coverImageId: args.coverImageId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.recipeSearch.indexRecipe, {
      recipeId,
    });

    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendNewRecipePush, {
      recipeId,
    });

    return recipeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    ...recipeDraftValidator.fields,
    coverImageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recipe = await getRecipeForUser(ctx, args.id);
    const photoIds = recipe.photos ?? [];

    if (args.coverImageId !== undefined) {
      if (photoIds.length === 0) {
        throw new Error("Cette recette n'a pas de photos à choisir comme image principale.");
      }
      if (!photoIds.includes(args.coverImageId)) {
        throw new Error("L'image principale doit faire partie des photos.");
      }
    }

    const normalized = normalizeRecipeDraft(args);

    const patch: {
      name: string;
      ingredients: typeof normalized.ingredients;
      steps: typeof normalized.steps;
      servings?: number;
      prepTime?: number;
      cookTime?: number;
      totalTime?: number;
      notes?: string;
      tags: string[];
      searchText: string;
      updatedAt: number;
      coverImageId?: Id<"_storage">;
    } = {
      name: normalized.name,
      ingredients: normalized.ingredients,
      steps: normalized.steps,
      servings: normalized.servings,
      prepTime: normalized.prepTime,
      cookTime: normalized.cookTime,
      totalTime: normalized.totalTime,
      notes: normalized.notes,
      tags: normalized.tags,
      searchText: normalized.searchText,
      updatedAt: Date.now(),
    };

    if (photoIds.length > 0 && args.coverImageId !== undefined) {
      patch.coverImageId = args.coverImageId;
    }

    await ctx.db.patch("recipes", args.id, patch);

    await ctx.scheduler.runAfter(0, internal.recipeSearch.indexRecipe, {
      recipeId: args.id,
    });

    return null;
  },
});

export const setIngredientChecked = mutation({
  args: {
    id: v.id("recipes"),
    index: v.number(),
    checked: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recipe = await getRecipeForUser(ctx, args.id);

    if (
      !Number.isInteger(args.index) ||
      args.index < 0 ||
      args.index >= recipe.ingredients.length
    ) {
      throw new Error("Ingrédient introuvable.");
    }

    await ctx.db.patch("recipes", args.id, {
      ingredients: setIngredientCheckedAtIndex(
        recipe.ingredients,
        args.index,
        args.checked,
      ),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const setStepCompleted = mutation({
  args: {
    id: v.id("recipes"),
    index: v.number(),
    completed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recipe = await getRecipeForUser(ctx, args.id);

    if (
      !Number.isInteger(args.index) ||
      args.index < 0 ||
      args.index >= recipe.steps.length
    ) {
      throw new Error("Étape introuvable.");
    }

    await ctx.db.patch("recipes", args.id, {
      steps: setStepCheckedAtIndex(recipe.steps, args.index, args.completed),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const resetCookingProgress = mutation({
  args: { id: v.id("recipes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recipe = await getRecipeForUser(ctx, args.id);

    if (!hasCookingProgress(recipe.ingredients, recipe.steps)) {
      return null;
    }

    await ctx.db.patch("recipes", args.id, {
      ingredients: clearCookingProgress(recipe.ingredients),
      steps: clearStepCookingProgress(recipe.steps),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const recipe = await ctx.db.get("recipes", args.id);
    if (recipe === null) {
      throw new Error("Recette introuvable.");
    }

    await deleteRecipeChatData(ctx, args.id);
    await deleteRecipeCollectionMemberships(ctx, args.id);

    const photoIds = new Set(recipe.photos ?? []);
    if (
      recipe.coverImageId !== undefined &&
      !photoIds.has(recipe.coverImageId)
    ) {
      await ctx.storage.delete(recipe.coverImageId);
    }

    for (const photoId of photoIds) {
      await ctx.storage.delete(photoId);
    }

    await ctx.db.delete("recipes", args.id);
    return null;
  },
});
