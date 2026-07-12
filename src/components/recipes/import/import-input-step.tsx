import { CameraIcon, ImageIcon, LinkIcon } from "lucide-react";
import { useNavigate } from "react-router";

import { RecipePhotoGrid } from "@/components/recipes/recipe-photo-grid";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MAX_RECIPE_PHOTOS } from "@shared/recipeImageLimits";
import type { ImportMode } from "./use-recipe-import";

const hiddenFileInputClassName =
  "pointer-events-none fixed top-0 left-0 h-px w-px opacity-0";

type ImportInputStepProps = {
  importMode: ImportMode;
  url: string;
  error: string | null;
  isAnalyzing: boolean;
  previewUrls: string[];
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFilesCount: number;
  onModeChange: (mode: ImportMode) => void;
  onUrlChange: (url: string) => void;
  onClearError: () => void;
  onCameraPhotoSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryPhotosSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onAnalyzeUrl: (event: React.FormEvent<HTMLFormElement>) => void;
  onAnalyzePhotos: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ImportInputStep({
  importMode,
  url,
  error,
  isAnalyzing,
  previewUrls,
  cameraInputRef,
  galleryInputRef,
  selectedFilesCount,
  onModeChange,
  onUrlChange,
  onClearError,
  onCameraPhotoSelected,
  onGalleryPhotosSelected,
  onRemovePhoto,
  onAnalyzeUrl,
  onAnalyzePhotos,
}: ImportInputStepProps) {
  const navigate = useNavigate();
  const photosLimitReached = selectedFilesCount >= MAX_RECIPE_PHOTOS;
  const photoPickerDisabled = isAnalyzing || photosLimitReached;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Importer une recette</CardTitle>
        <CardDescription>
          Importez depuis une page web ou à partir de photos d&apos;une recette.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ToggleGroup
          value={[importMode]}
          onValueChange={(values) => {
            const next = values[0];
            if (next === "url" || next === "photos") {
              onModeChange(next);
            }
          }}
          className="w-full"
          variant="outline"
        >
          <ToggleGroupItem value="url" className="flex-1">
            <LinkIcon data-icon="inline-start" />
            URL
          </ToggleGroupItem>
          <ToggleGroupItem value="photos" className="flex-1">
            <ImageIcon data-icon="inline-start" />
            Photos
          </ToggleGroupItem>
        </ToggleGroup>

        {importMode === "url" ? (
          <form onSubmit={onAnalyzeUrl} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={error !== null}>
                <FieldLabel htmlFor="recipe-url">URL de la recette</FieldLabel>
                <Input
                  id="recipe-url"
                  type="url"
                  value={url}
                  onChange={(event) => {
                    onClearError();
                    onUrlChange(event.target.value);
                  }}
                  placeholder="https://example.com/ma-recette"
                  required
                />
                {error !== null ? <FieldError>{error}</FieldError> : null}
              </Field>
            </FieldGroup>
            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Extraction en cours...
                  </>
                ) : (
                  "Analyser"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={onAnalyzePhotos} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={error !== null}>
                <FieldLabel>Photos de la recette</FieldLabel>
                <input
                  ref={cameraInputRef}
                  id="recipe-photos-camera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  tabIndex={-1}
                  className={hiddenFileInputClassName}
                  onChange={onCameraPhotoSelected}
                />
                <input
                  ref={galleryInputRef}
                  id="recipe-photos-gallery"
                  type="file"
                  accept="image/*"
                  multiple
                  tabIndex={-1}
                  className={hiddenFileInputClassName}
                  onChange={onGalleryPhotosSelected}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    nativeButton={false}
                    variant="outline"
                    className="flex-1 py-1"
                    disabled={photoPickerDisabled}
                    render={<label htmlFor="recipe-photos-camera" />}
                  >
                    <CameraIcon data-icon="inline-start" />
                    {selectedFilesCount > 0
                      ? "Ajouter une photo"
                      : "Prendre une photo"}
                  </Button>
                  <Button
                    nativeButton={false}
                    variant="outline"
                    className="flex-1 py-1"
                    disabled={photoPickerDisabled}
                    render={<label htmlFor="recipe-photos-gallery" />}
                  >
                    <ImageIcon data-icon="inline-start" />
                    Galerie
                  </Button>
                </div>
                <FieldDescription>
                  Jusqu&apos;à {MAX_RECIPE_PHOTOS} images (5 Mo chacune).
                  Sur iPhone, la caméra et la galerie sont deux actions
                  distinctes : prenez plusieurs pages une par une, ou
                  sélectionnez-les en une fois depuis la galerie.
                </FieldDescription>
                {error !== null ? <FieldError>{error}</FieldError> : null}
              </Field>
            </FieldGroup>

            <RecipePhotoGrid
              urls={previewUrls}
              altPrefix="Aperçu"
              onRemovePhoto={isAnalyzing ? undefined : onRemovePhoto}
            />

            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isAnalyzing || selectedFilesCount === 0}
              >
                {isAnalyzing ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Extraction en cours...
                  </>
                ) : (
                  "Analyser"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
