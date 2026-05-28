import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const MAX_STORED_MESSAGES = 100;

const chatMessageValidator = v.object({
  _id: v.id("recipeChatMessages"),
  recipeId: v.id("recipes"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  createdAt: v.number(),
});

const recipeForChatValidator = v.union(
  v.object({
    _id: v.id("recipes"),
    name: v.string(),
    servings: v.optional(v.number()),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    totalTime: v.optional(v.number()),
    tags: v.array(v.string()),
    notes: v.optional(v.string()),
    ingredients: v.array(
      v.object({
        name: v.string(),
        quantity: v.optional(v.string()),
        unit: v.optional(v.string()),
      }),
    ),
    steps: v.array(
      v.object({
        text: v.string(),
      }),
    ),
  }),
  v.null(),
);

export const getRecipeForChat = internalQuery({
  args: { recipeId: v.id("recipes") },
  returns: recipeForChatValidator,
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (recipe === null) {
      return null;
    }

    return {
      _id: recipe._id,
      name: recipe.name,
      servings: recipe.servings,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      tags: recipe.tags,
      notes: recipe.notes,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    };
  },
});

export const listMessagesForChat = internalQuery({
  args: { recipeId: v.id("recipes") },
  returns: v.array(
    v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("recipeChatMessages")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("asc")
      .take(MAX_STORED_MESSAGES);

    return rows.map((row) => ({
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    }));
  },
});

export const insertMessage = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("recipeChatMessages", {
      recipeId: args.recipeId,
      role: args.role,
      content: args.content,
      createdAt: args.createdAt,
    });
    return null;
  },
});

export const listMessages = query({
  args: { recipeId: v.id("recipes") },
  returns: v.array(chatMessageValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const recipe = await ctx.db.get(args.recipeId);
    if (recipe === null) {
      throw new Error("Recette introuvable.");
    }

    const rows = await ctx.db
      .query("recipeChatMessages")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("asc")
      .take(MAX_STORED_MESSAGES);

    return rows.map((row) => ({
      _id: row._id,
      recipeId: row.recipeId,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    }));
  },
});

export const clearMessages = mutation({
  args: { recipeId: v.id("recipes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const recipe = await ctx.db.get(args.recipeId);
    if (recipe === null) {
      throw new Error("Recette introuvable.");
    }

    const rows = await ctx.db
      .query("recipeChatMessages")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const row of rows) {
      await ctx.db.delete(row._id);
    }

    return null;
  },
});
