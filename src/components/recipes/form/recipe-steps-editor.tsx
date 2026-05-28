import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Item, ItemActions, ItemContent, ItemGroup, ItemMedia } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeDraft } from "@/lib/recipe-types";
import { StepNumber } from "../step-number";

type RecipeStepsEditorProps = {
  value: RecipeDraft;
  onChange: (value: RecipeDraft) => void;
};

export function RecipeStepsEditor({ value, onChange }: RecipeStepsEditorProps) {
  function updateStep(index: number, nextValue: string) {
    onChange({
      ...value,
      steps: value.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, text: nextValue } : step,
      ),
    });
  }

  return (
    <FieldSet>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <FieldLegend className="mb-0">Étapes</FieldLegend>
          <FieldDescription className="mb-0">
            Décrivez la préparation étape par étape.
          </FieldDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange({
              ...value,
              steps: [...value.steps, { text: "" }],
            })
          }
        >
          <Plus data-icon="inline-start" />
          Ajouter
        </Button>
      </div>

      <ItemGroup>
        {value.steps.map((step, index) => (
          <Item key={`step-${index}`} size="xs">
            <ItemMedia>
              <StepNumber index={index} />
            </ItemMedia>
            <ItemContent>
              <Field>
                <FieldLabel htmlFor={`step-text-${index}`} className="sr-only">
                  Étape {index + 1}
                </FieldLabel>
                <Textarea
                  id={`step-text-${index}`}
                  value={step.text}
                  onChange={(event) => updateStep(index, event.target.value)}
                  rows={3}
                />
              </Field>
            </ItemContent>
            <ItemActions>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={value.steps.length <= 1}
                onClick={() =>
                  onChange({
                    ...value,
                    steps: value.steps.filter(
                      (_, stepIndex) => stepIndex !== index,
                    ),
                  })
                }
                aria-label={`Supprimer l'étape ${index + 1}`}
              >
                <Minus />
              </Button>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </FieldSet>
  );
}
