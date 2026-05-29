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
        checked: v.optional(v.boolean()),
      }),
    ),
    steps: v.array(
      v.object({
        text: v.string(),
        checked: v.optional(v.boolean()),
      }),
    ),
    servings: v.optional(v.number()),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    totalTime: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
    sourceLabel: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
    coverImageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    searchText: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_name", ["name"])
    .searchIndex("search_recipes", {
      searchField: "searchText",
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    }),
  recipeChatConversations: defineTable({
    recipeId: v.id("recipes"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_recipe", ["recipeId", "updatedAt"]),
  recipeChatMessages: defineTable({
    conversationId: v.id("recipeChatConversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId", "createdAt"]),
});
