import { useMutation } from "convex/react";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import type { RecipeDraft, RecipeIngredient } from "@/lib/recipe-types";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeIngredientsListProps = {
  recipeId: Id<"recipes">;
  ingredients: RecipeDraft["ingredients"];
};

function IngredientLine({ ingredient }: { ingredient: RecipeIngredient }) {
  const quantity = ingredient.quantity?.trim();
  const unit = ingredient.unit?.trim();
  const name = ingredient.name.trim();
  const measure = [quantity, unit].filter(Boolean).join(" ");

  if (!measure) {
    return name;
  }

  return (
    <span>
      <span className="font-semibold">{measure}</span> {name}
    </span>
  );
}

export function RecipeIngredientsList({
  recipeId,
  ingredients,
}: RecipeIngredientsListProps) {
  const setIngredientChecked = useMutation(api.recipes.setIngredientChecked);

  return (
    <FieldSet>
      <FieldLegend>Ingrédients</FieldLegend>
      <FieldDescription>
        {ingredients.length} ingrédient{ingredients.length > 1 ? "s" : ""}
      </FieldDescription>
      <ItemGroup>
        {ingredients.map((ingredient, index) => {
          const isChecked = ingredient.checked === true;

          return (
            <Item
              key={`${ingredient.name}-${index}`}
              size="xs"
              variant={isChecked ? "muted" : "outline"}
              render={<label />}
            >
              <ItemMedia variant="icon">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    void setIngredientChecked({
                      id: recipeId,
                      index,
                      checked,
                    });
                  }}
                />
              </ItemMedia>
              <ItemContent
                className={cn(isChecked && "text-muted-foreground")}
              >
                <ItemTitle className="line-clamp-none font-normal">
                  <IngredientLine ingredient={ingredient} />
                </ItemTitle>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </FieldSet>
  );
}
