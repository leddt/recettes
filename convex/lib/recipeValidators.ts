import { v } from "convex/values";

export const ingredientValidator = v.object({
  name: v.string(),
  quantity: v.optional(v.string()),
  unit: v.optional(v.string()),
});

export const stepValidator = v.object({
  text: v.string(),
});

export const recipeDraftValidator = v.object({
  name: v.string(),
  ingredients: v.array(ingredientValidator),
  steps: v.array(stepValidator),
  servings: v.optional(v.number()),
  prepTime: v.optional(v.number()),
  cookTime: v.optional(v.number()),
  totalTime: v.optional(v.number()),
  notes: v.optional(v.string()),
  tags: v.array(v.string()),
});

export const extractedRecipeValidator = v.object({
  ...recipeDraftValidator.fields,
  sourceUrl: v.optional(v.string()),
  sourceLabel: v.optional(v.string()),
  photos: v.optional(v.array(v.id("_storage"))),
});

export const recipeListItemValidator = v.object({
  _id: v.id("recipes"),
  name: v.string(),
  servings: v.optional(v.number()),
  prepTime: v.optional(v.number()),
  cookTime: v.optional(v.number()),
  totalTime: v.optional(v.number()),
  sourceUrl: v.optional(v.string()),
  tags: v.array(v.string()),
});

export const recipeSearchResultValidator = v.object({
  ...recipeListItemValidator.fields,
  source: v.union(v.literal("text"), v.literal("semantic")),
  score: v.optional(v.number()),
});

export const recipeDetailValidator = v.object({
  _id: v.id("recipes"),
  ...recipeDraftValidator.fields,
  sourceUrl: v.optional(v.string()),
  sourceLabel: v.optional(v.string()),
  photos: v.optional(v.array(v.id("_storage"))),
  photoUrls: v.optional(v.array(v.union(v.string(), v.null()))),
});
