import { v } from "convex/values";

import { createPasswordAccount } from "./lib/createPasswordAccount";
import { internalMutation } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";

const createUserAccountResult = v.object({
  email: v.string(),
  userId: v.id("users"),
});

/**
 * Créer un compte mot de passe depuis le dashboard Convex.
 *
 * Exemple d'arguments :
 * `{ "email": "nouveau@recettes.local", "password": "motdepasse", "name": "Nouveau" }`
 */
export const createUserAccount = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  returns: createUserAccountResult,
  handler: async (ctx, args) => {
    try {
      return await createPasswordAccount(ctx as unknown as ActionCtx, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.toLowerCase().includes("already") ||
        message.toLowerCase().includes("exists") ||
        message.toLowerCase().includes("duplicate")
      ) {
        throw new Error(`Un compte existe déjà pour ${args.email.trim()}.`);
      }
      throw error;
    }
  },
});
