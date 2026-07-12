export type FormattableIngredient = {
  name: string;
  quantity?: string;
  unit?: string;
};

export function formatIngredient(ingredient: FormattableIngredient): string {
  return [ingredient.quantity, ingredient.unit, ingredient.name]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join(" ");
}
