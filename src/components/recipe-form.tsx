import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  tagsFromInput,
  tagsToInput,
  type RecipeDraft,
} from "@/lib/recipe-types";

type RecipeFormProps = {
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

export function RecipeForm({
  value,
  onChange,
  sourceUrl,
  sourceLabel,
  readOnlySource = false,
  onReanalyzeWithAi,
  isReanalyzing = false,
}: RecipeFormProps) {
  const [reanalyzeDialogOpen, setReanalyzeDialogOpen] = useState(false);
  const [reanalyzeInstructions, setReanalyzeInstructions] = useState("");

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

  function updateStep(index: number, nextValue: string) {
    onChange({
      ...value,
      steps: value.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, text: nextValue } : step,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Vérifiez et ajustez les détails extraits avant l&apos;enregistrement.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <FieldLabel htmlFor="recipe-prep-time">
                  Préparation (min)
                </FieldLabel>
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
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        disabled={isReanalyzing}
                        onClick={() => setReanalyzeDialogOpen(true)}
                      >
                        {isReanalyzing
                          ? "Analyse IA..."
                          : "Ré-analyser avec l'IA"}
                      </Button>
                      <Dialog
                        open={reanalyzeDialogOpen}
                        onOpenChange={(open) => {
                          setReanalyzeDialogOpen(open);
                          if (!open) {
                            setReanalyzeInstructions("");
                          }
                        }}
                      >
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Ré-analyser avec l&apos;IA</DialogTitle>
                            <DialogDescription>
                              Ajoutez des instructions pour guider
                              l&apos;extraction (optionnel).
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            value={reanalyzeInstructions}
                            onChange={(event) =>
                              setReanalyzeInstructions(event.target.value)
                            }
                            placeholder="Ex. : conserver les sous-étapes détaillées, ignorer la section dessert..."
                            rows={4}
                            disabled={isReanalyzing}
                          />
                          <DialogFooter className="border-t-0 bg-transparent p-0 sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isReanalyzing}
                              onClick={() => setReanalyzeDialogOpen(false)}
                            >
                              Annuler
                            </Button>
                            <Button
                              type="button"
                              disabled={isReanalyzing}
                              onClick={() => {
                                const trimmed = reanalyzeInstructions.trim();
                                setReanalyzeDialogOpen(false);
                                setReanalyzeInstructions("");
                                void onReanalyzeWithAi(
                                  trimmed.length > 0 ? trimmed : undefined,
                                );
                              }}
                            >
                              {isReanalyzing
                                ? "Analyse IA..."
                                : "Ré-analyser"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Ingrédients</CardTitle>
            <CardDescription>
              Quantité et unité sont optionnelles.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...value,
                ingredients: [
                  ...value.ingredients,
                  { name: "", quantity: "", unit: "" },
                ],
              })
            }
          >
            <Plus />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {value.ingredients.map((ingredient, index) => (
            <div
              key={`ingredient-${index}`}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <Field>
                <FieldLabel htmlFor={`ingredient-name-${index}`}>Nom</FieldLabel>
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
                <FieldLabel htmlFor={`ingredient-unit-${index}`}>Unité</FieldLabel>
                <Input
                  id={`ingredient-unit-${index}`}
                  value={ingredient.unit ?? ""}
                  onChange={(event) =>
                    updateIngredient(index, "unit", event.target.value)
                  }
                />
              </Field>
              <div className="flex items-end">
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
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Étapes</CardTitle>
            <CardDescription>Décrivez la préparation étape par étape.</CardDescription>
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
            <Plus />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {value.steps.map((step, index) => (
            <div
              key={`step-${index}`}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[auto_1fr_auto]"
            >
              <div className="flex h-8 items-center text-sm font-medium text-muted-foreground">
                {index + 1}.
              </div>
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
              <div className="flex items-start">
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
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
