"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { askRecipeQuestion } from "./lib/recipeChatAi";
import { buildRecipeChatContext } from "./lib/recipeChatContext";
import { conversationTitleFromMessage } from "./lib/recipeChatTitle";
import { requireAuthUserId } from "./lib/requireAuth";

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
    conversationId: v.optional(v.id("recipeChatConversations")),
    content: v.string(),
  },
  returns: v.id("recipeChatConversations"),
  handler: async (ctx, args): Promise<Id<"recipeChatConversations">> => {
    await requireAuthUserId(ctx);

    const trimmed = validateUserContent(args.content);

    const recipe = await ctx.runQuery(internal.recipeChat.getRecipeForChat, {
      recipeId: args.recipeId,
    });
    if (recipe === null) {
      throw new Error("Recette introuvable.");
    }

    const now = Date.now();
    let conversationId: Id<"recipeChatConversations"> | undefined = args.conversationId;

    if (conversationId !== undefined) {
      const conversation = await ctx.runQuery(internal.recipeChat.getConversation, {
        conversationId,
      });
      if (conversation === null || conversation.recipeId !== args.recipeId) {
        throw new Error("Question introuvable.");
      }
    } else {
      conversationId = await ctx.runMutation(internal.recipeChat.createConversation, {
        recipeId: args.recipeId,
        title: conversationTitleFromMessage(trimmed),
        createdAt: now,
      });
    }

    await ctx.runMutation(internal.recipeChat.insertMessage, {
      conversationId,
      role: "user",
      content: trimmed,
      createdAt: now,
    });

    const storedMessages = await ctx.runQuery(internal.recipeChat.listMessagesForChat, {
      conversationId,
    });

    const contextMessages = storedMessages
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((message: { role: "user" | "assistant"; content: string }) => ({
        role: message.role,
        content: message.content,
      }));

    const recipeContext = buildRecipeChatContext(recipe);
    const reply = await askRecipeQuestion({
      recipeContext,
      messages: contextMessages,
    });

    const replyAt = Date.now();
    await ctx.runMutation(internal.recipeChat.insertMessage, {
      conversationId,
      role: "assistant",
      content: reply,
      createdAt: replyAt,
    });

    await ctx.runMutation(internal.recipeChat.touchConversation, {
      conversationId,
      updatedAt: replyAt,
    });

    return conversationId;
  },
});
