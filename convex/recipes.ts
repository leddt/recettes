import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  recipeDetailValidator,
  recipeDraftValidator,
  recipeListItemValidator,
} from "./lib/recipeValidators";
import { buildRecipeSearchText } from "./lib/recipeSearchText";
import { mutation, query } from "./_generated/server";

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

export const get = query({
  args: { id: v.id("recipes") },
  returns: v.union(recipeDetailValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const recipe = await ctx.db.get("recipes", args.id);
    if (recipe === null) {
      return null;
    }

    const photos = recipe.photos;
    const photoUrls =
      photos && photos.length > 0
        ? await Promise.all(photos.map((photoId) => ctx.storage.getUrl(photoId)))
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
      notes: recipe.notes,
      tags: recipe.tags,
    };
  },
});

export const list = query({
  args: {},
  returns: v.array(recipeListItemValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const recipes = await ctx.db.query("recipes").withIndex("by_name").collect();

    return recipes
      .map((recipe) => ({
        _id: recipe._id,
        name: recipe.name,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.totalTime,
        sourceUrl: recipe.sourceUrl,
        tags: recipe.tags,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "fr"));
  },
});

export const create = mutation({
  args: {
    ...recipeDraftValidator.fields,
    sourceUrl: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.id("recipes"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const { name, ingredients, steps } = validateRecipeDraft(args);
    const now = Date.now();
    const normalizedIngredients = ingredients.map((ingredient) => ({
      name: ingredient.name.trim(),
      quantity: ingredient.quantity?.trim() || undefined,
      unit: ingredient.unit?.trim() || undefined,
    }));
    const tags = args.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    const searchText = buildRecipeSearchText({
      name,
      notes: args.notes?.trim() || undefined,
      tags,
      ingredients: normalizedIngredients,
    });

    const recipeId = await ctx.db.insert("recipes", {
      name,
      ingredients: normalizedIngredients,
      steps: steps.map((step) => ({
        text: step.text.trim(),
      })),
      servings: args.servings,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      totalTime: args.totalTime,
      sourceUrl: args.sourceUrl?.trim() || undefined,
      sourceLabel: args.sourceLabel?.trim() || undefined,
      photos:
        args.photos && args.photos.length > 0 ? args.photos : undefined,
      notes: args.notes?.trim() || undefined,
      tags,
      searchText,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.recipeSearch.indexRecipe, {
      recipeId,
    });

    return recipeId;
  },
});
