export type RecipeIngredient = {
  name: string;
  quantity?: string;
  unit?: string;
};

export type RecipeStep = {
  text: string;
};

export type RecipeDraft = {
  name: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  notes?: string;
  tags: string[];
};

export type ExtractedRecipe = RecipeDraft & {
  sourceUrl?: string;
  sourceLabel?: string;
};

export function createEmptyRecipeDraft(): RecipeDraft {
  return {
    name: "",
    ingredients: [{ name: "", quantity: "", unit: "" }],
    steps: [{ text: "" }],
    tags: [],
  };
}

export function validateRecipeDraft(draft: RecipeDraft): string | null {
  if (draft.name.trim().length === 0) {
    return "Le nom de la recette est obligatoire.";
  }

  const ingredients = draft.ingredients.filter(
    (ingredient) => ingredient.name.trim().length > 0,
  );
  if (ingredients.length === 0) {
    return "Ajoutez au moins un ingrédient.";
  }

  const steps = draft.steps.filter((step) => step.text.trim().length > 0);
  if (steps.length === 0) {
    return "Ajoutez au moins une étape.";
  }

  return null;
}

export function normalizeRecipeDraft(draft: RecipeDraft): RecipeDraft {
  return {
    name: draft.name.trim(),
    ingredients: draft.ingredients
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity?.trim() || undefined,
        unit: ingredient.unit?.trim() || undefined,
      }))
      .filter((ingredient) => ingredient.name.length > 0),
    steps: draft.steps
      .map((step) => ({ text: step.text.trim() }))
      .filter((step) => step.text.length > 0),
    servings: draft.servings,
    prepTime: draft.prepTime,
    cookTime: draft.cookTime,
    notes: draft.notes?.trim() || undefined,
    tags: draft.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
  };
}

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
}): string {
  return [
    recipe.servings
      ? `${recipe.servings} portion${recipe.servings > 1 ? "s" : ""}`
      : null,
    recipe.prepTime ? `${recipe.prepTime} min de préparation` : null,
    recipe.cookTime ? `${recipe.cookTime} min de cuisson` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatIngredient(ingredient: RecipeIngredient): string {
  return [
    ingredient.quantity?.trim(),
    ingredient.unit?.trim(),
    ingredient.name.trim(),
  ]
    .filter((part) => part && part.length > 0)
    .join(" ");
}
