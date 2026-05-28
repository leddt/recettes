import { ImageIcon, LinkIcon } from "lucide-react";
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
import { MAX_RECIPE_PHOTOS } from "../../../../convex/lib/recipeImageLimits";
import type { ImportMode } from "./use-recipe-import";

type ImportInputStepProps = {
  importMode: ImportMode;
  url: string;
  error: string | null;
  isAnalyzing: boolean;
  previewUrls: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFilesCount: number;
  onModeChange: (mode: ImportMode) => void;
  onUrlChange: (url: string) => void;
  onClearError: () => void;
  onFilesSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeUrl: (event: React.FormEvent<HTMLFormElement>) => void;
  onAnalyzePhotos: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ImportInputStep({
  importMode,
  url,
  error,
  isAnalyzing,
  previewUrls,
  fileInputRef,
  selectedFilesCount,
  onModeChange,
  onUrlChange,
  onClearError,
  onFilesSelected,
  onAnalyzeUrl,
  onAnalyzePhotos,
}: ImportInputStepProps) {
  const navigate = useNavigate();

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
                <FieldLabel htmlFor="recipe-photos">Photos de la recette</FieldLabel>
                <Input
                  ref={fileInputRef}
                  id="recipe-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFilesSelected}
                />
                <FieldDescription>
                  Jusqu&apos;à {MAX_RECIPE_PHOTOS} images (5 Mo chacune).
                  Plusieurs pages d&apos;un même livre sont fusionnées en une
                  recette.
                </FieldDescription>
                {error !== null ? <FieldError>{error}</FieldError> : null}
              </Field>
            </FieldGroup>

            <RecipePhotoGrid urls={previewUrls} altPrefix="Aperçu" />

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
