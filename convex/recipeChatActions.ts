"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { askRecipeQuestion } from "./lib/recipeChatAi";
import { buildRecipeChatContext } from "./lib/recipeChatContext";

const MAX_CONTEXT_MESSAGES = 40;
const MAX_USER_MESSAGE_LENGTH = 2_000;

function validateUserContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error("Écrivez une question avant d'envoyer.");
  }
  if (trimmed.length > MAX_USER_MESSAGE_LENGTH) {
    throw new Error(
      `La question ne peut pas dépasser ${MAX_USER_MESSAGE_LENGTH} caractères.`,
    );
  }
  return trimmed;
}

export const sendMessage = action({
  args: {
    recipeId: v.id("recipes"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const trimmed = validateUserContent(args.content);

    const recipe = await ctx.runQuery(internal.recipeChat.getRecipeForChat, {
      recipeId: args.recipeId,
    });
    if (recipe === null) {
      throw new Error("Recette introuvable.");
    }

    const now = Date.now();
    await ctx.runMutation(internal.recipeChat.insertMessage, {
      recipeId: args.recipeId,
      role: "user",
      content: trimmed,
      createdAt: now,
    });

    const storedMessages = await ctx.runQuery(internal.recipeChat.listMessagesForChat, {
      recipeId: args.recipeId,
    });

    const contextMessages = storedMessages.slice(-MAX_CONTEXT_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const recipeContext = buildRecipeChatContext(recipe);
    const reply = await askRecipeQuestion({
      recipeContext,
      messages: contextMessages,
    });

    await ctx.runMutation(internal.recipeChat.insertMessage, {
      recipeId: args.recipeId,
      role: "assistant",
      content: reply,
      createdAt: Date.now(),
    });

    return null;
  },
});
