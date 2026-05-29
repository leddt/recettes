import { Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemGroup } from "@/components/ui/item";
import type { RecipeDraft } from "@/lib/recipe-types";

type RecipeIngredientsEditorProps = {
  value: RecipeDraft;
  onChange: (value: RecipeDraft) => void;
};

export function RecipeIngredientsEditor({
  value,
  onChange,
}: RecipeIngredientsEditorProps) {
  function updateIngredient(
    index: number,
    field: "name" | "quantity" | "unit",
    nextValue: string,
  ) {
    onChange({
      ...value,
      ingredients: value.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index
          ? { ...ingredient, [field]: nextValue }
          : ingredient,
      ),
    });
  }

  return (
    <ItemGroup>
        {value.ingredients.map((ingredient, index) => (
          <Item key={`ingredient-${index}`} variant="outline">
            <ItemContent>
              <FieldGroup className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <Field>
                  <FieldLabel htmlFor={`ingredient-name-${index}`}>
                    Nom
                  </FieldLabel>
                  <Input
                    id={`ingredient-name-${index}`}
                    value={ingredient.name}
                    onChange={(event) =>
                      updateIngredient(index, "name", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`ingredient-quantity-${index}`}>
                    Quantité
                  </FieldLabel>
                  <Input
                    id={`ingredient-quantity-${index}`}
                    value={ingredient.quantity ?? ""}
                    onChange={(event) =>
                      updateIngredient(index, "quantity", event.target.value)
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`ingredient-unit-${index}`}>
                    Unité
                  </FieldLabel>
                  <Input
                    id={`ingredient-unit-${index}`}
                    value={ingredient.unit ?? ""}
                    onChange={(event) =>
                      updateIngredient(index, "unit", event.target.value)
                    }
                  />
                </Field>
              </FieldGroup>
            </ItemContent>
            <ItemActions>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={value.ingredients.length <= 1}
                onClick={() =>
                  onChange({
                    ...value,
                    ingredients: value.ingredients.filter(
                      (_, ingredientIndex) => ingredientIndex !== index,
                    ),
                  })
                }
                aria-label={`Supprimer l'ingrédient ${index + 1}`}
              >
                <Minus />
              </Button>
            </ItemActions>
          </Item>
        ))}
    </ItemGroup>
  );
}

export function addEmptyIngredient(value: RecipeDraft): RecipeDraft {
  return {
    ...value,
    ingredients: [...value.ingredients, { name: "", quantity: "", unit: "" }],
  };
}
