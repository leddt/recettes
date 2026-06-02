import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

const subscriptionDocValidator = v.object({
  _id: v.id("pushSubscriptions"),
  userId: v.id("users"),
  endpoint: v.string(),
  p256dh: v.string(),
  auth: v.string(),
});

export const save = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing !== null) {
      await ctx.db.patch("pushSubscriptions", existing._id, {
        userId,
        p256dh: args.p256dh,
        auth: args.auth,
      });
      return null;
    }

    await ctx.db.insert("pushSubscriptions", {
      userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: { endpoint: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing !== null && existing.userId === userId) {
      await ctx.db.delete("pushSubscriptions", existing._id);
    }

    return null;
  },
});

export const accountStatus = query({
  args: {},
  returns: v.object({
    count: v.number(),
    endpoints: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { count: 0, endpoints: [] };
    }

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      count: subscriptions.length,
      endpoints: subscriptions.map((subscription) => subscription.endpoint),
    };
  },
});

export const removeAll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const subscription of subscriptions) {
      await ctx.db.delete("pushSubscriptions", subscription._id);
    }

    return null;
  },
});

export const listTargetsForRecipe = internalQuery({
  args: { recipeId: v.id("recipes") },
  returns: v.object({
    recipeName: v.string(),
    authorName: v.string(),
    coverImageUrl: v.optional(v.string()),
    subscriptions: v.array(subscriptionDocValidator),
  }),
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get("recipes", args.recipeId);
    if (recipe === null) {
      throw new Error("Recette introuvable.");
    }

    const coverImageUrl =
      recipe.coverImageId !== undefined
        ? ((await ctx.storage.getUrl(recipe.coverImageId)) ?? undefined)
        : undefined;

    const authorId = recipe.createdBy;
    let authorName = "Quelqu'un";
    if (authorId !== undefined) {
      const author = await ctx.db.get("users", authorId);
      if (author !== null) {
        authorName = author.name ?? author.email ?? "Quelqu'un";
      }
    }

    const users = await ctx.db.query("users").collect();
    const subscriptions = [];

    for (const user of users) {
      if (authorId !== undefined && user._id === authorId) {
        continue;
      }

      const userSubscriptions = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      subscriptions.push(...userSubscriptions);
    }

    return {
      recipeName: recipe.name,
      authorName,
      coverImageUrl,
      subscriptions: subscriptions.map((subscription) => ({
        _id: subscription._id,
        userId: subscription.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      })),
    };
  },
});

export const deleteById = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete("pushSubscriptions", args.subscriptionId);
    return null;
  },
});
