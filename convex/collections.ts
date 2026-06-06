import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireAuthUserId } from "./lib/requireAuth";

const collectionValidator = v.object({
  _id: v.id("collections"),
  name: v.string(),
});

const collectionWithRecipeCountValidator = v.object({
  _id: v.id("collections"),
  name: v.string(),
  recipeCount: v.number(),
});

function normalizeCollectionName(name: string): string {
  const normalized = name.trim();
  if (normalized.length === 0) {
    throw new Error("Le nom de la collection est obligatoire.");
  }
  return normalized;
}

function hasSameCollectionName(left: string, right: string): boolean {
  return (
    left.localeCompare(right, "fr", { sensitivity: "base" }) === 0
  );
}

async function getCollectionByName(
  ctx: MutationCtx,
  name: string,
): Promise<Id<"collections"> | null> {
  const collections = await ctx.db
    .query("collections")
    .withIndex("by_name")
    .collect();
  const match = collections.find((collection) =>
    hasSameCollectionName(collection.name, name),
  );
  return match?._id ?? null;
}

export const list = query({
  args: {},
  returns: v.array(collectionValidator),
  handler: async (ctx) => {
    await requireAuthUserId(ctx);

    const collections = await ctx.db
      .query("collections")
      .withIndex("by_name")
      .collect();

    return collections
      .map((collection) => ({
        _id: collection._id,
        name: collection.name,
      }))
      .sort((left, right) =>
        left.name.localeCompare(right.name, "fr"),
      );
  },
});

export const listWithRecipeCounts = query({
  args: {},
  returns: v.array(collectionWithRecipeCountValidator),
  handler: async (ctx) => {
    await requireAuthUserId(ctx);

    const collections = await ctx.db
      .query("collections")
      .withIndex("by_name")
      .collect();

    const memberships = await ctx.db.query("recipeCollections").collect();
    const recipeCountByCollection = new Map<Id<"collections">, number>();
    for (const membership of memberships) {
      recipeCountByCollection.set(
        membership.collectionId,
        (recipeCountByCollection.get(membership.collectionId) ?? 0) + 1,
      );
    }

    return collections
      .map((collection) => ({
        _id: collection._id,
        name: collection.name,
        recipeCount: recipeCountByCollection.get(collection._id) ?? 0,
      }))
      .sort((left, right) =>
        left.name.localeCompare(right.name, "fr"),
      );
  },
});

export const listForRecipe = query({
  args: { recipeId: v.id("recipes") },
  returns: v.array(v.id("collections")),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const memberships = await ctx.db
      .query("recipeCollections")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    return memberships.map((membership) => membership.collectionId);
  },
});

export const listRecipeIdsByCollection = query({
  args: { collectionId: v.id("collections") },
  returns: v.array(v.id("recipes")),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const collection = await ctx.db.get("collections", args.collectionId);
    if (collection === null) {
      throw new Error("Collection introuvable.");
    }

    const memberships = await ctx.db
      .query("recipeCollections")
      .withIndex("by_collection", (q) =>
        q.eq("collectionId", args.collectionId),
      )
      .collect();

    return memberships.map((membership) => membership.recipeId);
  },
});

export const create = mutation({
  args: { name: v.string() },
  returns: v.id("collections"),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const name = normalizeCollectionName(args.name);

    const existingId = await getCollectionByName(ctx, name);
    if (existingId !== null) {
      throw new Error("Une collection avec ce nom existe déjà.");
    }

    return await ctx.db.insert("collections", {
      name,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const createWithOptionalRecipe = mutation({
  args: {
    name: v.string(),
    recipeId: v.optional(v.id("recipes")),
  },
  returns: v.id("collections"),
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const name = normalizeCollectionName(args.name);

    if (args.recipeId !== undefined) {
      const recipe = await ctx.db.get("recipes", args.recipeId);
      if (recipe === null) {
        throw new Error("Recette introuvable.");
      }
    }

    const existingId = await getCollectionByName(ctx, name);
    if (existingId !== null) {
      throw new Error("Une collection avec ce nom existe déjà.");
    }

    const collectionId = await ctx.db.insert("collections", {
      name,
      createdBy: userId,
      createdAt: Date.now(),
    });

    if (args.recipeId !== undefined) {
      await ctx.db.insert("recipeCollections", {
        recipeId: args.recipeId,
        collectionId,
      });
    }

    return collectionId;
  },
});

export const addRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    collectionId: v.id("collections"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const recipe = await ctx.db.get("recipes", args.recipeId);
    if (recipe === null) {
      throw new Error("Recette introuvable.");
    }

    const collection = await ctx.db.get("collections", args.collectionId);
    if (collection === null) {
      throw new Error("Collection introuvable.");
    }

    const existing = await ctx.db
      .query("recipeCollections")
      .withIndex("by_recipe_and_collection", (q) =>
        q.eq("recipeId", args.recipeId).eq("collectionId", args.collectionId),
      )
      .unique();

    if (existing === null) {
      await ctx.db.insert("recipeCollections", {
        recipeId: args.recipeId,
        collectionId: args.collectionId,
      });
    }

    return null;
  },
});

export const rename = mutation({
  args: {
    collectionId: v.id("collections"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);
    const name = normalizeCollectionName(args.name);

    const collection = await ctx.db.get("collections", args.collectionId);
    if (collection === null) {
      throw new Error("Collection introuvable.");
    }

    if (!hasSameCollectionName(collection.name, name)) {
      const existingId = await getCollectionByName(ctx, name);
      if (existingId !== null && existingId !== args.collectionId) {
        throw new Error("Une collection avec ce nom existe déjà.");
      }
    }

    await ctx.db.patch("collections", args.collectionId, { name });
    return null;
  },
});

export const remove = mutation({
  args: { collectionId: v.id("collections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const collection = await ctx.db.get("collections", args.collectionId);
    if (collection === null) {
      throw new Error("Collection introuvable.");
    }

    const memberships = await ctx.db
      .query("recipeCollections")
      .withIndex("by_collection", (q) =>
        q.eq("collectionId", args.collectionId),
      )
      .collect();

    for (const membership of memberships) {
      await ctx.db.delete("recipeCollections", membership._id);
    }

    await ctx.db.delete("collections", args.collectionId);
    return null;
  },
});

export const removeRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    collectionId: v.id("collections"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const existing = await ctx.db
      .query("recipeCollections")
      .withIndex("by_recipe_and_collection", (q) =>
        q.eq("recipeId", args.recipeId).eq("collectionId", args.collectionId),
      )
      .unique();

    if (existing !== null) {
      await ctx.db.delete("recipeCollections", existing._id);
    }

    return null;
  },
});
