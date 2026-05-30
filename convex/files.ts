import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

export const ORPHAN_CLEANUP_BATCH_SIZE = 50;
const ORPHAN_CLEANUP_GRACE_PERIOD_MS = 12 * 60 * 60 * 1000;

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

async function collectReferencedStorageIds(
  ctx: MutationCtx,
): Promise<Array<Id<"_storage">>> {
  const recipes = await ctx.db.query("recipes").collect();
  const referencedIds = new Set<Id<"_storage">>();

  for (const recipe of recipes) {
    if (recipe.coverImageId !== undefined) {
      referencedIds.add(recipe.coverImageId);
    }

    for (const photoId of recipe.photos ?? []) {
      referencedIds.add(photoId);
    }
  }

  return [...referencedIds];
}

/** Nettoyage manuel : `npx convex run files:cleanupOrphanedStorage` */
export const cleanupOrphanedStorage = internalMutation({
  args: {
    paginationOpts: paginationOptsValidator,
    referencedIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const referencedIds =
      args.referencedIds ?? (await collectReferencedStorageIds(ctx));
    const referencedSet = new Set(referencedIds);
    const gracePeriodCutoff = Date.now() - ORPHAN_CLEANUP_GRACE_PERIOD_MS;

    const page = await ctx.db.system
      .query("_storage")
      .order("asc")
      .paginate(args.paginationOpts);

    for (const file of page.page) {
      if (
        !referencedSet.has(file._id) &&
        file._creationTime < gracePeriodCutoff
      ) {
        await ctx.storage.delete(file._id);
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.files.cleanupOrphanedStorage, {
        paginationOpts: {
          numItems: args.paginationOpts.numItems,
          cursor: page.continueCursor,
        },
        referencedIds,
      });
    }

    return null;
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
