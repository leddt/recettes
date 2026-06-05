import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericActionCtx } from "convex/server";

import type { DataModel, Id } from "../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx =
  | QueryCtx
  | MutationCtx
  | ActionCtx
  | GenericActionCtx<DataModel>;

export async function requireAuthUserId(ctx: AuthCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Non authentifié.");
  }

  if ("db" in ctx) {
    const user = await ctx.db.get("users", userId);
    if (user === null) {
      throw new Error("Non authentifié.");
    }
  }

  return userId;
}
