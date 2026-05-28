import { useState } from "react";

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

type RecipeStepsListProps = {
  steps: RecipeDraft["steps"];
};

export function RecipeStepsList({ steps }: RecipeStepsListProps) {
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    () => new Set(),
  );

  function toggleCompleted(index: number) {
    setCompletedIndices((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <FieldSet>
      <FieldLegend>Préparation</FieldLegend>
      <FieldDescription>
        {steps.length} étape{steps.length > 1 ? "s" : ""}
      </FieldDescription>
      <ItemGroup>
        {steps.map((step, index) => {
          const isCompleted = completedIndices.has(index);

          return (
            <Item
              key={`step-${index}`}
              size="xs"
              variant={isCompleted ? "muted" : "default"}
              render={<label />}
              onClick={() => toggleCompleted(index)}
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
