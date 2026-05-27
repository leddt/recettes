const MAX_SEARCH_TEXT_LENGTH = 8_000;

export type RecipeForSearchText = {
  name: string;
  notes?: string;
  tags: string[];
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
};

function formatIngredient(ingredient: RecipeForSearchText["ingredients"][number]): string {
  const parts = [ingredient.quantity, ingredient.unit, ingredient.name].filter(
    (part) => part !== undefined && part.length > 0,
  );
  return parts.join(" ");
}

export function buildRecipeSearchText(recipe: RecipeForSearchText): string {
  const lines: string[] = [`Nom: ${recipe.name.trim()}`];

  if (recipe.tags.length > 0) {
    lines.push(`Tags: ${recipe.tags.join(", ")}`);
  }

  const notes = recipe.notes?.trim();
  if (notes) {
    lines.push(`Notes: ${notes}`);
  }

  if (recipe.ingredients.length > 0) {
    lines.push("Ingrédients:");
    for (const ingredient of recipe.ingredients) {
      lines.push(`- ${formatIngredient(ingredient)}`);
    }
  }

  const text = lines.join("\n");
  if (text.length <= MAX_SEARCH_TEXT_LENGTH) {
    return text;
  }

  return text.slice(0, MAX_SEARCH_TEXT_LENGTH);
}
