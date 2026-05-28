import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { formatIngredient } from "@/lib/recipe-types";
import type { RecipeDraft } from "@/lib/recipe-types";

type RecipeIngredientsListProps = {
  ingredients: RecipeDraft["ingredients"];
};

export function RecipeIngredientsList({
  ingredients,
}: RecipeIngredientsListProps) {
  return (
    <FieldSet>
      <FieldLegend>Ingrédients</FieldLegend>
      <FieldDescription>
        {ingredients.length} ingrédient{ingredients.length > 1 ? "s" : ""}
      </FieldDescription>
      <ItemGroup>
        {ingredients.map((ingredient, index) => (
          <Item key={`${ingredient.name}-${index}`} size="xs" variant="outline">
            <ItemContent>
              <ItemTitle className="font-normal">
                {formatIngredient(ingredient)}
              </ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </FieldSet>
  );
}
