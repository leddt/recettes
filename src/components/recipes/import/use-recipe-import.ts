import { useAction, useMutation } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import {
  createEmptyRecipeDraft,
  normalizeRecipeDraft,
  validateRecipeDraft,
  type ExtractedRecipe,
  type RecipeDraft,
} from "@/lib/recipe-types";
import { uploadRecipePhotos } from "@/lib/upload-recipe-photos";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MAX_RECIPE_PHOTOS } from "../../../../convex/lib/recipeImageLimits";

export type ImportMode = "url" | "photos";
export type ImportStep = "input" | "review";

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

export function useRecipeImport() {
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

  async function handleReanalyzeWithAi(userInstructions?: string) {
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

        const result = await extractFromImages({
          storageIds,
          userInstructions,
        });
        setExtracted(result);
        setDraft(extractedToDraft(result));
        setUploadedPhotoIds(storageIds);
        return;
      }

      const sourceUrl = extracted?.sourceUrl ?? url.trim();
      if (sourceUrl.length === 0) {
        return;
      }

      const result = await extractFromUrl({
        url: sourceUrl,
        forceAi: true,
        userInstructions,
      });
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

  return {
    importMode,
    step,
    url,
    setUrl,
    setError,
    selectedFiles,
    previewUrls,
    extracted,
    draft,
    setDraft,
    error,
    isAnalyzing,
    isReanalyzing,
    isSaving,
    fileInputRef,
    resetToInput,
    handleModeChange,
    handleFilesSelected,
    handleAnalyzeUrl,
    handleAnalyzePhotos,
    handleReanalyzeWithAi,
    handleSave,
    navigate,
  };
}
