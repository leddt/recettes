import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  recipes: defineTable({
    name: v.string(),
    ingredients: v.array(
      v.object({
        name: v.string(),
        quantity: v.optional(v.string()),
        unit: v.optional(v.string()),
      }),
    ),
    steps: v.array(
      v.object({
        text: v.string(),
      }),
    ),
    servings: v.optional(v.number()),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),
});
