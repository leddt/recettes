import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  recipeListItemValidator,
  recipeSearchResultValidator,
} from "./lib/recipeValidators";
import { embedTexts } from "./lib/recipeEmbeddings";
import { buildRecipeSearchText } from "./lib/recipeSearchText";
import { requireAuthUserId } from "./lib/requireAuth";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

const BACKFILL_BATCH_SIZE = 20;
const BACKFILL_SEARCH_TEXT_BATCH_SIZE = 50;
const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;
const MIN_QUERY_LENGTH = 2;
const MIN_ABSOLUTE_VECTOR_SCORE = 0.32;
const MAX_VECTOR_SCORE_GAP_FROM_TOP = 0.12;

type RecipeListSource = {
  _id: Id<"recipes">;
  name: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  sourceUrl?: string;
  tags: string[];
  coverImageId?: Id<"_storage">;
};

async function toListItem(ctx: QueryCtx, recipe: RecipeListSource) {
  return {
    _id: recipe._id,
    name: recipe.name,
    servings: recipe.servings,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    sourceUrl: recipe.sourceUrl,
    tags: recipe.tags,
    coverImageUrl: recipe.coverImageId
      ? await ctx.storage.getUrl(recipe.coverImageId)
      : undefined,
  };
}

function passesVectorScoreCutoff(score: number, topScore: number): boolean {
  return score >= Math.max(MIN_ABSOLUTE_VECTOR_SCORE, topScore - MAX_VECTOR_SCORE_GAP_FROM_TOP);
}

export const getRecipeForIndexing = internalQuery({
  args: { recipeId: v.id("recipes") },
  returns: v.union(
    v.object({
      _id: v.id("recipes"),
      name: v.string(),
      notes: v.optional(v.string()),
      tags: v.array(v.string()),
      ingredients: v.array(
        v.object({
          name: v.string(),
          quantity: v.optional(v.string()),
          unit: v.optional(v.string()),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get("recipes", args.recipeId);
    if (recipe === null) {
      return null;
    }

    return {
      _id: recipe._id,
      name: recipe.name,
      notes: recipe.notes,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
    };
  },
});

export const listRecipesWithoutEmbedding = internalQuery({
  args: { limit: v.number() },
  returns: v.array(v.id("recipes")),
  handler: async (ctx, args) => {
    const missing: Id<"recipes">[] = [];

    for await (const recipe of ctx.db.query("recipes")) {
      if (recipe.embedding === undefined) {
        missing.push(recipe._id);
        if (missing.length >= args.limit) {
          break;
        }
      }
    }

    return missing;
  },
});

export const listRecipesWithoutSearchText = internalQuery({
  args: { limit: v.number() },
  returns: v.array(v.id("recipes")),
  handler: async (ctx, args) => {
    const missing: Id<"recipes">[] = [];

    for await (const recipe of ctx.db.query("recipes")) {
      if (recipe.searchText === undefined) {
        missing.push(recipe._id);
        if (missing.length >= args.limit) {
          break;
        }
      }
    }

    return missing;
  },
});

export const searchFts = internalQuery({
  args: {
    query: v.string(),
    limit: v.number(),
  },
  returns: v.array(recipeListItemValidator),
  handler: async (ctx, args) => {
    const trimmedQuery = args.query.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const recipes = await ctx.db
      .query("recipes")
      .withSearchIndex("search_recipes", (q) => q.search("searchText", trimmedQuery))
      .take(args.limit);

    return Promise.all(recipes.map((recipe) => toListItem(ctx, recipe)));
  },
});

export const getRecipeListItems = internalQuery({
  args: { recipeIds: v.array(v.id("recipes")) },
  returns: v.array(v.union(recipeListItemValidator, v.null())),
  handler: async (ctx, args) => {
    return Promise.all(
      args.recipeIds.map(async (recipeId) => {
        const recipe = await ctx.db.get("recipes", recipeId);
        if (recipe === null) {
          return null;
        }

        return toListItem(ctx, recipe);
      }),
    );
  },
});

export const setRecipeEmbedding = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    embedding: v.array(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get("recipes", args.recipeId);
    if (recipe === null) {
      return null;
    }

    await ctx.db.patch("recipes", args.recipeId, {
      embedding: args.embedding,
    });

    return null;
  },
});

/** Backfill searchText for FTS: `npx convex run recipeSearch:backfillSearchText` */
export const backfillSearchText = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const recipeIds = await ctx.runQuery(internal.recipeSearch.listRecipesWithoutSearchText, {
      limit: BACKFILL_SEARCH_TEXT_BATCH_SIZE,
    });

    for (const recipeId of recipeIds) {
      const recipe = await ctx.db.get("recipes", recipeId);
      if (recipe === null) {
        continue;
      }

      await ctx.db.patch("recipes", recipeId, {
        searchText: buildRecipeSearchText({
          name: recipe.name,
          notes: recipe.notes,
          tags: recipe.tags,
          ingredients: recipe.ingredients,
        }),
      });
    }

    if (recipeIds.length === BACKFILL_SEARCH_TEXT_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.recipeSearch.backfillSearchText, {});
    }

    return null;
  },
});

export const indexRecipe = internalAction({
  args: { recipeId: v.id("recipes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recipe = await ctx.runQuery(internal.recipeSearch.getRecipeForIndexing, {
      recipeId: args.recipeId,
    });

    if (recipe === null) {
      return null;
    }

    const searchText = buildRecipeSearchText(recipe);
    const [embedding] = await embedTexts([searchText]);

    await ctx.runMutation(internal.recipeSearch.setRecipeEmbedding, {
      recipeId: args.recipeId,
      embedding,
    });

    return null;
  },
});

/** Backfill embeddings for existing recipes: `npx convex run recipeSearch:backfillEmbeddings` */
export const backfillEmbeddings = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const recipeIds = await ctx.runQuery(
      internal.recipeSearch.listRecipesWithoutEmbedding,
      { limit: BACKFILL_BATCH_SIZE },
    );

    for (const recipeId of recipeIds) {
      await ctx.runAction(internal.recipeSearch.indexRecipe, { recipeId });
    }

    if (recipeIds.length === BACKFILL_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.recipeSearch.backfillEmbeddings, {});
    }

    return null;
  },
});

export const search = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(recipeSearchResultValidator),
  handler: async (ctx, args) => {
    await requireAuthUserId(ctx);

    const trimmedQuery = args.query.trim();
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const limit = Math.min(
      Math.max(args.limit ?? DEFAULT_SEARCH_LIMIT, 1),
      MAX_SEARCH_LIMIT,
    );

    const [ftsResults, vectorMatches] = await Promise.all([
      ctx.runQuery(internal.recipeSearch.searchFts, {
        query: trimmedQuery,
        limit,
      }),
      (async () => {
        const [queryEmbedding] = await embedTexts([trimmedQuery]);
        return ctx.vectorSearch("recipes", "by_embedding", {
          vector: queryEmbedding,
          limit,
        });
      })(),
    ]);

    const seenIds = new Set<Id<"recipes">>();
    const results: Array<{
      _id: Id<"recipes">;
      name: string;
      servings?: number;
      prepTime?: number;
      cookTime?: number;
      totalTime?: number;
      sourceUrl?: string;
      tags: string[];
      coverImageUrl?: string | null;
      source: "text" | "semantic";
      score?: number;
    }> = [];

    for (const item of ftsResults) {
      if (results.length >= limit) {
        break;
      }
      seenIds.add(item._id);
      results.push({ ...item, source: "text" });
    }

    if (vectorMatches.length > 0 && results.length < limit) {
      const topScore = vectorMatches[0]._score;
      const vectorIds = vectorMatches.map(
        (match: { _id: Id<"recipes">; _score: number }) => match._id,
      );
      const listItems = await ctx.runQuery(internal.recipeSearch.getRecipeListItems, {
        recipeIds: vectorIds,
      });

      for (let index = 0; index < vectorMatches.length; index += 1) {
        if (results.length >= limit) {
          break;
        }

        const match = vectorMatches[index];
        if (seenIds.has(match._id)) {
          continue;
        }

        if (!passesVectorScoreCutoff(match._score, topScore)) {
          continue;
        }

        const item = listItems[index];
        if (item === null) {
          continue;
        }

        seenIds.add(match._id);
        results.push({
          ...item,
          source: "semantic",
          score: match._score,
        });
      }
    }

    return results;
  },
});
