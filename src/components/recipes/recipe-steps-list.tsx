import { useMutation } from "convex/react";

import { StepNumber } from "@/components/recipes/step-number";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import type { RecipeDraft } from "@/lib/recipe-types";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeStepsListProps = {
  recipeId: Id<"recipes">;
  steps: RecipeDraft["steps"];
};

export function RecipeStepsList({ recipeId, steps }: RecipeStepsListProps) {
  const setStepCompleted = useMutation(api.recipes.setStepCompleted);

  return (
    <FieldSet>
      <FieldLegend>Préparation</FieldLegend>
      <FieldDescription>
        {steps.length} étape{steps.length > 1 ? "s" : ""}
      </FieldDescription>
      <ItemGroup>
        {steps.map((step, index) => {
          const isCompleted = step.checked === true;

          return (
            <Item
              key={`step-${index}`}
              size="xs"
              variant={isCompleted ? "muted" : "default"}
              render={<label />}
              onClick={() => {
                void setStepCompleted({
                  id: recipeId,
                  index,
                  completed: !isCompleted,
                });
              }}
            >
              <ItemMedia>
                <StepNumber completed={isCompleted} index={index} />
              </ItemMedia>
              <ItemContent
                className={cn(isCompleted && "text-muted-foreground")}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {step.text}
                </p>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </FieldSet>
  );
}
