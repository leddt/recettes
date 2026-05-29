import { useMutation } from "convex/react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { formatSectionCount } from "@/lib/format-section-count";
import { cn } from "@/lib/utils";
import type { RecipeDraft, RecipeIngredient } from "@/lib/recipe-types";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeIngredientsListProps = {
  recipeId: Id<"recipes">;
  ingredients: RecipeDraft["ingredients"];
  embedded?: boolean;
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

function IngredientsHeader({
  checked,
  total,
}: {
  checked: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-heading text-xl leading-snug font-medium">
        Ingrédients
      </h3>
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatSectionCount(checked, total)}
      </span>
    </div>
  );
}

export function RecipeIngredientsList({
  recipeId,
  ingredients,
  embedded = false,
}: RecipeIngredientsListProps) {
  const setIngredientChecked = useMutation(api.recipes.setIngredientChecked);
  const checkedCount = ingredients.filter(
    (ingredient) => ingredient.checked === true,
  ).length;
  const countLabel = formatSectionCount(checkedCount, ingredients.length);

  const list = (
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
            <ItemContent className={cn(isChecked && "text-muted-foreground")}>
              <ItemTitle className="line-clamp-none font-normal">
                <IngredientLine ingredient={ingredient} />
              </ItemTitle>
            </ItemContent>
          </Item>
        );
      })}
    </ItemGroup>
  );

  if (embedded) {
    return (
      <section className="flex h-full flex-col gap-4">
        <IngredientsHeader
          checked={checkedCount}
          total={ingredients.length}
        />
        {list}
      </section>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ingrédients</CardTitle>
        <CardAction>
          <span className="text-sm text-muted-foreground tabular-nums">
            {countLabel}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>{list}</CardContent>
    </Card>
  );
}
