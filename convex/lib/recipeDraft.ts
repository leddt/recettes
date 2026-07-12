export type RecipeDraftData = {
  name: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  steps: Array<{ text: string }>;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  notes?: string;
  tags: string[];
};

export function getRecipeDraftValidationError(
  draft: RecipeDraftData,
): string | null {
  if (draft.name.trim().length === 0) {
    return "Le nom de la recette est obligatoire.";
  }

  if (
    !draft.ingredients.some((ingredient) => ingredient.name.trim().length > 0)
  ) {
    return "Ajoutez au moins un ingrédient.";
  }

  if (!draft.steps.some((step) => step.text.trim().length > 0)) {
    return "Ajoutez au moins une étape.";
  }

  return null;
}

export function isValidRecipeDraft(draft: RecipeDraftData): boolean {
  return getRecipeDraftValidationError(draft) === null;
}

export function normalizeRecipeDraft(draft: RecipeDraftData): RecipeDraftData {
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
    totalTime: draft.totalTime,
    notes: draft.notes?.trim() || undefined,
    tags: draft.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
  };
}
