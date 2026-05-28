import { StepNumber } from "@/components/recipes/step-number";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
} from "@/components/ui/item";
import type { RecipeDraft } from "@/lib/recipe-types";

type RecipeStepsListProps = {
  steps: RecipeDraft["steps"];
};

export function RecipeStepsList({ steps }: RecipeStepsListProps) {
  return (
    <FieldSet>
      <FieldLegend>Préparation</FieldLegend>
      <FieldDescription>
        {steps.length} étape{steps.length > 1 ? "s" : ""}
      </FieldDescription>
      <ItemGroup>
        {steps.map((step, index) => (
          <Item key={`step-${index}`} size="xs">
            <ItemMedia>
              <StepNumber index={index} />
            </ItemMedia>
            <ItemContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {step.text}
              </p>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </FieldSet>
  );
}
