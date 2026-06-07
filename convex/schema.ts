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
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    searchText: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_name", ["name"])
    .index("by_createdAt", ["createdAt"])
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
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
  collections: defineTable({
    name: v.string(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_name", ["name"]),
  recipeCollections: defineTable({
    recipeId: v.id("recipes"),
    collectionId: v.id("collections"),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_collection", ["collectionId"])
    .index("by_recipe_and_collection", ["recipeId", "collectionId"]),
});
