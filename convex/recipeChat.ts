import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { ingredientValidator, stepValidator } from "./lib/recipeValidators";

const MAX_STORED_MESSAGES = 100;
const MAX_CONVERSATIONS = 50;

const chatMessageValidator = v.object({
  _id: v.id("recipeChatMessages"),
  conversationId: v.id("recipeChatConversations"),
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  createdAt: v.number(),
});

const conversationListItemValidator = v.object({
  _id: v.id("recipeChatConversations"),
  recipeId: v.id("recipes"),
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
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
    ingredients: v.array(ingredientValidator),
    steps: v.array(stepValidator),
  }),
  v.null(),
);

async function assertRecipeExists(ctx: QueryCtx | MutationCtx, recipeId: Id<"recipes">) {
  const recipe = await ctx.db.get("recipes", recipeId);
  if (recipe === null) {
    throw new Error("Recette introuvable.");
  }
}

export const getRecipeForChat = internalQuery({
  args: { recipeId: v.id("recipes") },
  returns: recipeForChatValidator,
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get("recipes", args.recipeId);
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

export const getConversation = internalQuery({
  args: { conversationId: v.id("recipeChatConversations") },
  returns: v.union(conversationListItemValidator, v.null()),
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("recipeChatConversations", args.conversationId);
    if (conversation === null) {
      return null;
    }

    return {
      _id: conversation._id,
      recipeId: conversation.recipeId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  },
});

export const createConversation = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    title: v.string(),
    createdAt: v.number(),
  },
  returns: v.id("recipeChatConversations"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipeChatConversations", {
      recipeId: args.recipeId,
      title: args.title,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
    });
  },
});

export const touchConversation = internalMutation({
  args: {
    conversationId: v.id("recipeChatConversations"),
    updatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch("recipeChatConversations", args.conversationId, {
      updatedAt: args.updatedAt,
    });
    return null;
  },
});

export const listMessagesForChat = internalQuery({
  args: { conversationId: v.id("recipeChatConversations") },
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
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
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
    conversationId: v.id("recipeChatConversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("recipeChatMessages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      createdAt: args.createdAt,
    });
    return null;
  },
});

export const listConversations = query({
  args: { recipeId: v.id("recipes") },
  returns: v.array(conversationListItemValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    await assertRecipeExists(ctx, args.recipeId);

    const rows = await ctx.db
      .query("recipeChatConversations")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("desc")
      .take(MAX_CONVERSATIONS);

    return rows.map((row) => ({
      _id: row._id,
      recipeId: row.recipeId,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const listMessages = query({
  args: { conversationId: v.id("recipeChatConversations") },
  returns: v.array(chatMessageValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const conversation = await ctx.db.get("recipeChatConversations", args.conversationId);
    if (conversation === null) {
      throw new Error("Question introuvable.");
    }

    const rows = await ctx.db
      .query("recipeChatMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(MAX_STORED_MESSAGES);

    return rows.map((row) => ({
      _id: row._id,
      conversationId: row.conversationId,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    }));
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("recipeChatConversations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const conversation = await ctx.db.get("recipeChatConversations", args.conversationId);
    if (conversation === null) {
      throw new Error("Question introuvable.");
    }

    const messages = await ctx.db
      .query("recipeChatMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete("recipeChatMessages", message._id);
    }

    await ctx.db.delete("recipeChatConversations", args.conversationId);
    return null;
  },
});
