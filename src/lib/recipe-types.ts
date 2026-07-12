export type RecipeIngredient = {
  name: string;
  quantity?: string;
  unit?: string;
  checked?: boolean;
};

export type RecipeStep = {
  text: string;
  checked?: boolean;
};

export type RecipeDraft = {
  name: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  notes?: string;
  tags: string[];
};

import type { Id } from "../../convex/_generated/dataModel";

export type ExtractedRecipe = RecipeDraft & {
  sourceUrl?: string;
  sourceLabel?: string;
  photos?: Id<"_storage">[];
  coverImageId?: Id<"_storage">;
  coverImageUrl?: string | null;
};

export type RecipeDetail = RecipeDraft & {
  _id: Id<"recipes">;
  sourceUrl?: string;
  sourceLabel?: string;
  photos?: Id<"_storage">[];
  photoUrls?: Array<string | null>;
  coverImageId?: Id<"_storage">;
  coverImageUrl?: string | null;
};

export function recipeDetailToDraft(recipe: RecipeDetail): RecipeDraft {
  return {
    name: recipe.name,
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients
        : createEmptyRecipeDraft().ingredients,
    steps:
      recipe.steps.length > 0 ? recipe.steps : createEmptyRecipeDraft().steps,
    servings: recipe.servings,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    notes: recipe.notes,
    tags: recipe.tags,
  };
}

export function coverIndexFromRecipe(
  photos: Id<"_storage">[] | undefined,
  coverImageId: Id<"_storage"> | undefined,
): number {
  if (!photos || photos.length === 0) {
    return 0;
  }

  if (coverImageId === undefined) {
    return 0;
  }

  const index = photos.indexOf(coverImageId);
  return index >= 0 ? index : 0;
}

export function createEmptyRecipeDraft(): RecipeDraft {
  return {
    name: "",
    ingredients: [{ name: "", quantity: "", unit: "" }],
    steps: [{ text: "" }],
    tags: [],
  };
}

export {
  getRecipeDraftValidationError as validateRecipeDraft,
  normalizeRecipeDraft,
} from "../../convex/lib/recipeDraft";

export function tagsToInput(tags: string[]): string {
  return tags.join(", ");
}

export function tagsFromInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function formatRecipeSummary(recipe: {
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
}): string {
  return [
    recipe.servings
      ? `${recipe.servings} portion${recipe.servings > 1 ? "s" : ""}`
      : null,
    recipe.prepTime ? `${recipe.prepTime} min de préparation` : null,
    recipe.cookTime ? `${recipe.cookTime} min de cuisson` : null,
    recipe.totalTime ? `${recipe.totalTime} min au total` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
