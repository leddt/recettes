import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";

import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireAuthUserId } from "./lib/requireAuth";
import { mutation, query } from "./_generated/server";

export const presence = new Presence(components.presence);

const activeRecipeViewValidator = v.object({
  userId: v.id("users"),
  userName: v.string(),
  recipeId: v.id("recipes"),
  recipeName: v.string(),
});

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const authUserId = await requireAuthUserId(ctx);
    if (authUserId !== userId) {
      throw new Error("Non autorisé.");
    }
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    await requireAuthUserId(ctx);
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // Pas de vérif auth : appelé via sendBeacon à la fermeture d'onglet (sans JWT).
    // Sécurisé par sessionToken (UUID non devinable).
    return await presence.disconnect(ctx, sessionToken);
  },
});

export const activeRecipeViews = query({
  args: {},
  returns: v.array(activeRecipeViewValidator),
  handler: async (ctx) => {
    const currentUserId = await requireAuthUserId(ctx);

    const users = await ctx.db.query("users").collect();
    const views = [];

    for (const user of users) {
      if (user._id === currentUserId) {
        continue;
      }

      const rooms = await presence.listUser(ctx, user._id, true);
      for (const room of rooms) {
        const recipe = await ctx.db.get("recipes", room.roomId as Id<"recipes">);
        if (!recipe) {
          continue;
        }

        views.push({
          userId: user._id,
          userName: user.name ?? user.email ?? "Utilisateur",
          recipeId: recipe._id,
          recipeName: recipe.name,
        });
      }
    }

    return views;
  },
});
