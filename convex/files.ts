import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internalQuery, mutation } from "./_generated/server";

const storageMetadataValidator = v.object({
  contentType: v.optional(v.string()),
  size: v.number(),
});

export const getStorageMetadataBatch = internalQuery({
  args: { storageIds: v.array(v.id("_storage")) },
  returns: v.array(v.union(storageMetadataValidator, v.null())),
  handler: async (ctx, args) => {
    return Promise.all(
      args.storageIds.map(async (storageId) => {
        const metadata = await ctx.db.system.get("_storage", storageId);
        if (metadata === null) {
          return null;
        }

        return {
          contentType: metadata.contentType,
          size: metadata.size,
        };
      }),
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Non authentifié.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
