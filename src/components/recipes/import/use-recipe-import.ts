import { useAction, useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { parseSharedImportUrl } from "@/lib/parse-shared-import-url";
import {
  createEmptyRecipeDraft,
  normalizeRecipeDraft,
  validateRecipeDraft,
  type ExtractedRecipe,
  type RecipeDraft,
} from "@/lib/recipe-types";
import { uploadRecipePhotos } from "@/lib/upload-recipe-photos";
import { isRecipePhotoFile } from "@/lib/is-recipe-photo-file";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MAX_RECIPE_PHOTOS } from "@shared/recipeImageLimits";

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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const sharedImportStarted = useRef(false);

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
    setSelectedCoverIndex(0);
    setSelectedFiles([]);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  }

  function handleModeChange(mode: ImportMode) {
    setImportMode(mode);
    setError(null);
    setUrl("");
    setSelectedFiles([]);
    setUploadedPhotoIds([]);
    setSelectedCoverIndex(0);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  }

  function applySelectedFiles(files: File[]) {
    setError(null);

    if (files.length === 0) {
      return;
    }

    setSelectedFiles((currentFiles) => {
      const nextFiles = [...currentFiles, ...files];

      if (nextFiles.length > MAX_RECIPE_PHOTOS) {
        setError(`Maximum ${MAX_RECIPE_PHOTOS} photos par import.`);
        return nextFiles.slice(-MAX_RECIPE_PHOTOS);
      }

      const invalidFile = nextFiles.find((file) => !isRecipePhotoFile(file));
      if (invalidFile) {
        setError("Seules les images sont acceptées.");
        return currentFiles;
      }

      return nextFiles;
    });
  }

  function handleCameraPhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    applySelectedFiles(files);
  }

  function handleGalleryPhotosSelected(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    applySelectedFiles(files);
  }

  function handleRemovePhoto(index: number) {
    setError(null);
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  }

  const analyzeUrl = useCallback(
    async (sourceUrl: string) => {
      setError(null);
      setIsAnalyzing(true);

      try {
        const result = await extractFromUrl({ url: sourceUrl.trim() });
        setExtracted(result);
        setDraft(extractedToDraft(result));
        setSelectedCoverIndex(0);
        setStep("review");
      } catch (analyzeError) {
        setError(getImportErrorMessage(analyzeError));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [extractFromUrl],
  );

  useEffect(() => {
    if (sharedImportStarted.current) {
      return;
    }

    const sharedUrl = parseSharedImportUrl(searchParams);
    if (!sharedUrl) {
      return;
    }

    sharedImportStarted.current = true;
    setImportMode("url");
    setUrl(sharedUrl);
    setSearchParams({}, { replace: true });
    void analyzeUrl(sharedUrl);
  }, [analyzeUrl, searchParams, setSearchParams]);

  async function handleAnalyzeUrl(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await analyzeUrl(url);
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
      setSelectedCoverIndex(0);
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
        setSelectedCoverIndex(0);
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
      setSelectedCoverIndex(0);
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

      const coverImageId =
        importMode === "photos"
          ? photos && photos.length > 0
            ? photos[
                Math.min(selectedCoverIndex, photos.length - 1)
              ]
            : undefined
          : extracted?.coverImageId;

      await createRecipe({
        ...normalized,
        sourceUrl: extracted?.sourceUrl,
        sourceLabel: extracted?.sourceLabel,
        photos: photos && photos.length > 0 ? photos : undefined,
        coverImageId,
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
    cameraInputRef,
    galleryInputRef,
    resetToInput,
    handleModeChange,
    handleCameraPhotoSelected,
    handleGalleryPhotosSelected,
    handleRemovePhoto,
    handleAnalyzeUrl,
    handleAnalyzePhotos,
    handleReanalyzeWithAi,
    handleSave,
    navigate,
    selectedCoverIndex,
    setSelectedCoverIndex,
  };
}
