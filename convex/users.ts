import {
  getAuthUserId,
  invalidateSessions,
  modifyAccountCredentials,
} from "@convex-dev/auth/server";
import { v } from "convex/values";

import { createPasswordAccount } from "./lib/createPasswordAccount";
import { requireAuthUserId } from "./lib/requireAuth";
import { internal } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";

export const invalidateSessionsForUser = internalAction({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await invalidateSessions(ctx, { userId: args.userId });
    return null;
  },
});

const userListItemValidator = v.object({
  _id: v.id("users"),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
});

const userDocValidator = v.union(
  v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }),
  v.null(),
);

const createUserResultValidator = v.object({
  email: v.string(),
  userId: v.id("users"),
});

function formatDuplicateAccountError(email: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.toLowerCase().includes("already") ||
    message.toLowerCase().includes("exists") ||
    message.toLowerCase().includes("duplicate")
  ) {
    throw new Error(`Un compte existe déjà pour ${email.trim()}.`);
  }
  throw error;
}

export const viewer = query({
  args: {},
  returns: userDocValidator,
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    return await ctx.db.get("users", userId);
  },
});

export const list = query({
  args: {},
  returns: v.array(userListItemValidator),
  handler: async (ctx) => {
    await requireAuthUserId(ctx);

    const users = await ctx.db.query("users").collect();
    return users
      .map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
      }))
      .sort((left, right) => {
        const leftLabel = (left.name ?? left.email ?? "").toLocaleLowerCase(
          "fr",
        );
        const rightLabel = (right.name ?? right.email ?? "").toLocaleLowerCase(
          "fr",
        );
        return leftLabel.localeCompare(rightLabel, "fr");
      });
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  returns: createUserResultValidator,
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const password = args.password.trim();
    if (password.length < 6) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
    }

    try {
      return await createPasswordAccount(ctx as unknown as ActionCtx, {
        email: args.email,
        password,
        name: args.name,
      });
    } catch (error) {
      formatDuplicateAccountError(args.email, error);
    }
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();

    if (name.length === 0) {
      throw new Error("Le nom est obligatoire.");
    }
    if (email.length === 0) {
      throw new Error("Le courriel est obligatoire.");
    }

    const user = await ctx.db.get("users", args.userId);
    if (user === null) {
      throw new Error("Utilisateur introuvable.");
    }

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", "password"),
      )
      .unique();

    if (account === null) {
      throw new Error("Compte mot de passe introuvable.");
    }

    const emailChanged = user.email?.toLowerCase() !== email;

    if (emailChanged) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .unique();

      if (existingUser !== null && existingUser._id !== args.userId) {
        throw new Error(`Un compte existe déjà pour ${email}.`);
      }

      const existingAccount = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", email),
        )
        .unique();

      if (existingAccount !== null && existingAccount.userId !== args.userId) {
        throw new Error(`Un compte existe déjà pour ${email}.`);
      }

      await ctx.db.patch("authAccounts", account._id, {
        providerAccountId: email,
      });
    }

    await ctx.db.patch("users", args.userId, { name, email });

    if (emailChanged) {
      await ctx.scheduler.runAfter(0, internal.users.invalidateSessionsForUser, {
        userId: args.userId,
      });
    }

    return null;
  },
});

export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const newPassword = args.newPassword.trim();
    if (newPassword.length < 6) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
    }

    const user = await ctx.db.get("users", args.userId);
    if (user === null) {
      throw new Error("Utilisateur introuvable.");
    }

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", "password"),
      )
      .unique();

    if (account === null) {
      throw new Error("Compte mot de passe introuvable.");
    }

    const actionCtx = ctx as unknown as ActionCtx;
    await modifyAccountCredentials(actionCtx, {
      provider: "password",
      account: {
        id: account.providerAccountId,
        secret: newPassword,
      },
    });
    await ctx.scheduler.runAfter(0, internal.users.invalidateSessionsForUser, {
      userId: args.userId,
    });

    return null;
  },
});

export const remove = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUserId = await requireAuthUserId(ctx);

    if (args.userId === currentUserId) {
      throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
    }

    const user = await ctx.db.get("users", args.userId);
    if (user === null) {
      throw new Error("Utilisateur introuvable.");
    }

    await ctx.scheduler.runAfter(0, internal.users.invalidateSessionsForUser, {
      userId: args.userId,
    });

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
      .collect();

    for (const account of accounts) {
      const verificationCodes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();

      for (const code of verificationCodes) {
        await ctx.db.delete("authVerificationCodes", code._id);
      }

      await ctx.db.delete("authAccounts", account._id);
    }

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const subscription of subscriptions) {
      await ctx.db.delete("pushSubscriptions", subscription._id);
    }

    await ctx.db.delete("users", args.userId);
    return null;
  },
});
