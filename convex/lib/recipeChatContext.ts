import { formatIngredient } from "./formatIngredient";

const MAX_CONTEXT_LENGTH = 24_000;

export type RecipeForChatContext = {
  name: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  tags: string[];
  notes?: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  steps: Array<{ text: string }>;
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remainder} min`;
}

export function buildRecipeChatContext(recipe: RecipeForChatContext): string {
  const lines: string[] = [`# ${recipe.name.trim()}`];

  const meta: string[] = [];
  if (recipe.servings !== undefined) {
    meta.push(`${recipe.servings} portion${recipe.servings > 1 ? "s" : ""}`);
  }
  if (recipe.prepTime !== undefined) {
    meta.push(`préparation ${formatMinutes(recipe.prepTime)}`);
  }
  if (recipe.cookTime !== undefined) {
    meta.push(`cuisson ${formatMinutes(recipe.cookTime)}`);
  }
  if (recipe.totalTime !== undefined) {
    meta.push(`total ${formatMinutes(recipe.totalTime)}`);
  }
  if (meta.length > 0) {
    lines.push(meta.join(" · "));
  }

  if (recipe.tags.length > 0) {
    lines.push(`Tags : ${recipe.tags.join(", ")}`);
  }

  const notes = recipe.notes?.trim();
  if (notes) {
    lines.push("", "Notes :", notes);
  }

  if (recipe.ingredients.length > 0) {
    lines.push("", "Ingrédients :");
    for (const ingredient of recipe.ingredients) {
      lines.push(`- ${formatIngredient(ingredient)}`);
    }
  }

  if (recipe.steps.length > 0) {
    lines.push("", "Étapes :");
    for (let index = 0; index < recipe.steps.length; index += 1) {
      const step = recipe.steps[index]!;
      lines.push(`${index + 1}. ${step.text.trim()}`);
    }
  }

  const text = lines.join("\n");
  if (text.length <= MAX_CONTEXT_LENGTH) {
    return text;
  }

  return text.slice(0, MAX_CONTEXT_LENGTH);
}
