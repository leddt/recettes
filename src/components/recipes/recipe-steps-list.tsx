import { useMutation } from "convex/react";

import { StepNumber } from "@/components/recipes/step-number";
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
} from "@/components/ui/item";
import { formatSectionCount } from "@/lib/format-section-count";
import { cn } from "@/lib/utils";
import type { RecipeDraft } from "@/lib/recipe-types";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeStepsListProps = {
  recipeId: Id<"recipes">;
  steps: RecipeDraft["steps"];
  embedded?: boolean;
};

function StepsHeader({ checked, total }: { checked: number; total: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-heading text-xl leading-snug font-medium">Étapes</h3>
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatSectionCount(checked, total)}
      </span>
    </div>
  );
}

export function RecipeStepsList({
  recipeId,
  steps,
  embedded = false,
}: RecipeStepsListProps) {
  const setStepCompleted = useMutation(api.recipes.setStepCompleted);
  const checkedCount = steps.filter((step) => step.checked === true).length;
  const countLabel = formatSectionCount(checkedCount, steps.length);

  const list = (
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
            <ItemContent className={cn(isCompleted && "text-muted-foreground")}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {step.text}
              </p>
            </ItemContent>
          </Item>
        );
      })}
    </ItemGroup>
  );

  if (embedded) {
    return (
      <section className="flex h-full flex-col gap-4">
        <StepsHeader checked={checkedCount} total={steps.length} />
        {list}
      </section>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Étapes</CardTitle>
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
