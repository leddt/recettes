import { useAction, useMutation } from "convex/react";
import { useState } from "react";

import { RecipeForm } from "@/components/recipe-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createEmptyRecipeDraft,
  normalizeRecipeDraft,
  validateRecipeDraft,
  type ExtractedRecipe,
  type RecipeDraft,
} from "@/lib/recipe-types";
import { api } from "../../convex/_generated/api";

type RecipeImportFlowProps = {
  onCancel: () => void;
  onSaved: () => void;
};

function getImportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Impossible d'importer cette recette.";
}

function extractedToDraft(result: ExtractedRecipe): RecipeDraft {
  return {
    name: result.name,
    ingredients:
      result.ingredients.length > 0
        ? result.ingredients
        : createEmptyRecipeDraft().ingredients,
    steps:
      result.steps.length > 0 ? result.steps : createEmptyRecipeDraft().steps,
    servings: result.servings,
    prepTime: result.prepTime,
    cookTime: result.cookTime,
    notes: result.notes,
    tags: result.tags,
  };
}

export function RecipeImportFlow({ onCancel, onSaved }: RecipeImportFlowProps) {
  const extractFromUrl = useAction(api.recipeImport.extractFromUrl);
  const createRecipe = useMutation(api.recipes.create);

  const [step, setStep] = useState<"url" | "review">("url");
  const [url, setUrl] = useState("");
  const [extracted, setExtracted] = useState<ExtractedRecipe | null>(null);
  const [draft, setDraft] = useState(createEmptyRecipeDraft());
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await extractFromUrl({ url: url.trim() });
      setExtracted(result);
      setDraft(extractedToDraft(result));
      setStep("review");
    } catch (analyzeError) {
      setError(getImportErrorMessage(analyzeError));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleReanalyzeWithAi() {
    const sourceUrl = extracted?.sourceUrl ?? url.trim();
    if (sourceUrl.length === 0) {
      return;
    }

    setError(null);
    setIsReanalyzing(true);

    try {
      const result = await extractFromUrl({ url: sourceUrl, forceAi: true });
      setExtracted(result);
      setDraft(extractedToDraft(result));
    } catch (analyzeError) {
      setError(getImportErrorMessage(analyzeError));
    } finally {
      setIsReanalyzing(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateRecipeDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const normalized = normalizeRecipeDraft(draft);
      await createRecipe({
        ...normalized,
        sourceUrl: extracted?.sourceUrl,
        sourceLabel: extracted?.sourceLabel,
      });
      onSaved();
    } catch (saveError) {
      setError(getImportErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  if (step === "url") {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Importer une recette</CardTitle>
          <CardDescription>
            Collez l&apos;URL d&apos;une recette en ligne pour extraire automatiquement
            son contenu.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAnalyze}>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={error !== null}>
                <FieldLabel htmlFor="recipe-url">URL de la recette</FieldLabel>
                <Input
                  id="recipe-url"
                  type="url"
                  value={url}
                  onChange={(event) => {
                    setError(null);
                    setUrl(event.target.value);
                  }}
                  placeholder="https://example.com/ma-recette"
                  required
                />
                {error !== null ? <FieldError>{error}</FieldError> : null}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={isAnalyzing}>
              {isAnalyzing ? "Extraction en cours..." : "Analyser"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Revoir la recette</CardTitle>
          <CardDescription>
            Corrigez les informations extraites avant de les enregistrer.
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <RecipeForm
          value={draft}
          onChange={setDraft}
          sourceUrl={extracted?.sourceUrl}
          sourceLabel={extracted?.sourceLabel}
          readOnlySource
          onReanalyzeWithAi={handleReanalyzeWithAi}
          isReanalyzing={isReanalyzing}
        />

        {error !== null ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStep("url");
              setError(null);
            }}
          >
            Retour
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
