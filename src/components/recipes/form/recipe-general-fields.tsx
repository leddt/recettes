import { useState } from "react";

import { RecipeReanalyzeDialog } from "@/components/recipes/form/recipe-reanalyze-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  tagsFromInput,
  tagsToInput,
  type RecipeDraft,
} from "@/lib/recipe-types";

type RecipeGeneralFieldsProps = {
  value: RecipeDraft;
  onChange: (value: RecipeDraft) => void;
  sourceUrl?: string;
  sourceLabel?: string;
  readOnlySource?: boolean;
  onReanalyzeWithAi?: (userInstructions?: string) => void | Promise<void>;
  isReanalyzing?: boolean;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function RecipeGeneralFields({
  value,
  onChange,
  sourceUrl,
  sourceLabel,
  readOnlySource = false,
  onReanalyzeWithAi,
  isReanalyzing = false,
}: RecipeGeneralFieldsProps) {
  const [reanalyzeDialogOpen, setReanalyzeDialogOpen] = useState(false);

  return (
    <>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="recipe-name">Nom</FieldLabel>
          <Input
            id="recipe-name"
            value={value.name}
            onChange={(event) =>
              onChange({ ...value, name: event.target.value })
            }
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field>
            <FieldLabel htmlFor="recipe-servings">Portions</FieldLabel>
            <Input
              id="recipe-servings"
              type="number"
              min={1}
              value={value.servings ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  servings: parseOptionalNumber(event.target.value),
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="recipe-prep-time">Préparation (min)</FieldLabel>
            <Input
              id="recipe-prep-time"
              type="number"
              min={0}
              value={value.prepTime ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  prepTime: parseOptionalNumber(event.target.value),
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="recipe-cook-time">Cuisson (min)</FieldLabel>
            <Input
              id="recipe-cook-time"
              type="number"
              min={0}
              value={value.cookTime ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  cookTime: parseOptionalNumber(event.target.value),
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="recipe-total-time">Temps total (min)</FieldLabel>
            <Input
              id="recipe-total-time"
              type="number"
              min={0}
              value={value.totalTime ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  totalTime: parseOptionalNumber(event.target.value),
                })
              }
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="recipe-tags">Tags</FieldLabel>
          <Input
            id="recipe-tags"
            value={tagsToInput(value.tags)}
            onChange={(event) =>
              onChange({
                ...value,
                tags: tagsFromInput(event.target.value),
              })
            }
            placeholder="dessert, rapide, végétarien"
          />
          <FieldDescription>Séparez les tags par des virgules.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="recipe-notes">Notes</FieldLabel>
          <Textarea
            id="recipe-notes"
            value={value.notes ?? ""}
            onChange={(event) =>
              onChange({ ...value, notes: event.target.value })
            }
            rows={3}
          />
        </Field>

        {readOnlySource && (sourceUrl || sourceLabel) ? (
          <Field>
            <FieldLabel htmlFor="recipe-source">Source</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="recipe-source"
                className="sm:flex-1"
                value={sourceLabel ?? sourceUrl ?? ""}
                readOnly
              />
              {onReanalyzeWithAi ? (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={isReanalyzing}
                  onClick={() => setReanalyzeDialogOpen(true)}
                >
                  {isReanalyzing ? "Analyse IA..." : "Ré-analyser avec l'IA"}
                </Button>
              ) : null}
            </div>
            {sourceUrl ? (
              <FieldDescription>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {sourceUrl}
                </a>
              </FieldDescription>
            ) : null}
          </Field>
        ) : null}
      </FieldGroup>

      {onReanalyzeWithAi ? (
        <RecipeReanalyzeDialog
          open={reanalyzeDialogOpen}
          onOpenChange={setReanalyzeDialogOpen}
          isReanalyzing={isReanalyzing}
          onConfirm={(userInstructions) => {
            void onReanalyzeWithAi(userInstructions);
          }}
        />
      ) : null}
    </>
  );
}
