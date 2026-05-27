import { useAction, useMutation } from "convex/react";
import { ImageIcon, LinkIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

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
  FieldDescription,
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
import { uploadRecipePhotos } from "@/lib/upload-recipe-photos";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { MAX_RECIPE_PHOTOS } from "../../convex/lib/recipeImageLimits";

type ImportMode = "url" | "photos";
type ImportStep = "input" | "review";

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
    totalTime: result.totalTime,
    notes: result.notes,
    tags: result.tags,
  };
}

export function RecipeImportFlow() {
  const navigate = useNavigate();
  const extractFromUrl = useAction(api.recipeImport.extractFromUrl);
  const extractFromImages = useAction(api.recipeImport.extractFromImages);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createRecipe = useMutation(api.recipes.create);

  const [importMode, setImportMode] = useState<ImportMode>("url");
  const [step, setStep] = useState<ImportStep>("input");
  const [url, setUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState<Id<"_storage">[]>(
    [],
  );
  const [extracted, setExtracted] = useState<ExtractedRecipe | null>(null);
  const [draft, setDraft] = useState(createEmptyRecipeDraft());
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      for (const previewUrl of previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrls]);

  function resetToInput() {
    setStep("input");
    setError(null);
    setExtracted(null);
    setUploadedPhotoIds([]);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleModeChange(mode: ImportMode) {
    setImportMode(mode);
    setError(null);
    setUrl("");
    setSelectedFiles([]);
    setUploadedPhotoIds([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setError(null);

    if (files.length > MAX_RECIPE_PHOTOS) {
      setError(`Maximum ${MAX_RECIPE_PHOTOS} photos par import.`);
      setSelectedFiles(files.slice(0, MAX_RECIPE_PHOTOS));
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setError("Seules les images sont acceptées.");
      return;
    }

    setSelectedFiles(files);
  }

  async function handleAnalyzeUrl(event: React.FormEvent<HTMLFormElement>) {
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

  async function handleAnalyzePhotos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsAnalyzing(true);

    try {
      const storageIds = await uploadRecipePhotos(
        selectedFiles,
        () => generateUploadUrl(),
      );
      const result = await extractFromImages({ storageIds });
      setUploadedPhotoIds(storageIds);
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
    setError(null);
    setIsReanalyzing(true);

    try {
      if (importMode === "photos") {
        const storageIds =
          uploadedPhotoIds.length > 0
            ? uploadedPhotoIds
            : extracted?.photos ?? [];
        if (storageIds.length === 0) {
          return;
        }

        const result = await extractFromImages({ storageIds });
        setExtracted(result);
        setDraft(extractedToDraft(result));
        setUploadedPhotoIds(storageIds);
        return;
      }

      const sourceUrl = extracted?.sourceUrl ?? url.trim();
      if (sourceUrl.length === 0) {
        return;
      }

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
      const photos =
        importMode === "photos"
          ? uploadedPhotoIds.length > 0
            ? uploadedPhotoIds
            : extracted?.photos
          : undefined;

      await createRecipe({
        ...normalized,
        sourceUrl: extracted?.sourceUrl,
        sourceLabel: extracted?.sourceLabel,
        photos: photos && photos.length > 0 ? photos : undefined,
      });
      navigate("/");
    } catch (saveError) {
      setError(getImportErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  if (step === "input") {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Importer une recette</CardTitle>
          <CardDescription>
            Importez depuis une page web ou à partir de photos d&apos;une recette.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={importMode === "url" ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleModeChange("url")}
            >
              <LinkIcon className="size-4" />
              URL
            </Button>
            <Button
              type="button"
              variant={importMode === "photos" ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleModeChange("photos")}
            >
              <ImageIcon className="size-4" />
              Photos
            </Button>
          </div>

          {importMode === "url" ? (
            <form onSubmit={handleAnalyzeUrl}>
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
              <CardFooter className="mt-6 flex justify-between gap-3 px-0 pb-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? "Extraction en cours..." : "Analyser"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleAnalyzePhotos}>
              <FieldGroup>
                <Field data-invalid={error !== null}>
                  <FieldLabel htmlFor="recipe-photos">Photos de la recette</FieldLabel>
                  <Input
                    ref={fileInputRef}
                    id="recipe-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesSelected}
                  />
                  <FieldDescription>
                    Jusqu&apos;à {MAX_RECIPE_PHOTOS} images (5 Mo chacune). Plusieurs
                    pages d&apos;un même livre sont fusionnées en une recette.
                  </FieldDescription>
                  {error !== null ? <FieldError>{error}</FieldError> : null}
                </Field>
              </FieldGroup>

              {previewUrls.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previewUrls.map((previewUrl, index) => (
                    <li
                      key={previewUrl}
                      className="overflow-hidden rounded-lg border bg-muted/30"
                    >
                      <img
                        src={previewUrl}
                        alt={`Aperçu ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}

              <CardFooter className="mt-6 flex justify-between gap-3 px-0 pb-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isAnalyzing || selectedFiles.length === 0}
                >
                  {isAnalyzing ? "Extraction en cours..." : "Analyser"}
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
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
          <Button type="button" variant="outline" onClick={resetToInput}>
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
