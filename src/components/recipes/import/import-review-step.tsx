import { CoverPhotoPicker } from "@/components/recipes/import/cover-photo-picker";
import { RecipeCoverImage } from "@/components/recipes/recipe-cover-image";
import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import { RecipeForm } from "@/components/recipes/form/recipe-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ExtractedRecipe, RecipeDraft } from "@/lib/recipe-types";
import type { ImportMode } from "@/components/recipes/import/use-recipe-import";

type ImportReviewStepProps = {
  importMode: ImportMode;
  draft: RecipeDraft;
  extracted: ExtractedRecipe | null;
  previewUrls: string[];
  selectedCoverIndex: number;
  onCoverIndexChange: (index: number) => void;
  error: string | null;
  isReanalyzing: boolean;
  isSaving: boolean;
  onDraftChange: (draft: RecipeDraft) => void;
  onReanalyzeWithAi: (userInstructions?: string) => void | Promise<void>;
  onReset: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ImportReviewStep({
  importMode,
  draft,
  extracted,
  previewUrls,
  selectedCoverIndex,
  onCoverIndexChange,
  error,
  isReanalyzing,
  isSaving,
  onDraftChange,
  onReanalyzeWithAi,
  onReset,
  onSave,
}: ImportReviewStepProps) {
  const coverPreviewUrl =
    importMode === "url" ? extracted?.coverImageUrl : undefined;
  const showCoverCard =
    Boolean(coverPreviewUrl) ||
    (importMode === "photos" && previewUrls.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-4xl font-semibold">
          Revoir la recette
        </h1>
        <p className="text-sm text-muted-foreground">
          Corrigez les informations extraites avant de les enregistrer.
        </p>
      </header>

      <form onSubmit={onSave} className="flex flex-col gap-6 pb-24">
        {showCoverCard ? (
          <Card>
            <CardHeader>
              <CardTitle>Image principale</CardTitle>
              {importMode === "photos" ? (
                <CardDescription>
                  Choisissez la photo affichée dans la liste et en haut de la
                  fiche.
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {coverPreviewUrl ? (
                <RecipeCoverImage
                  url={coverPreviewUrl}
                  alt={draft.name || "Recette"}
                  className="w-full max-h-72 rounded-lg"
                />
              ) : null}

              {importMode === "photos" && previewUrls.length > 0 ? (
                <CoverPhotoPicker
                  urls={previewUrls}
                  selectedIndex={selectedCoverIndex}
                  onSelect={onCoverIndexChange}
                  altPrefix={draft.name || "Recette"}
                />
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <RecipeForm
          value={draft}
          onChange={onDraftChange}
          sourceUrl={extracted?.sourceUrl}
          sourceLabel={extracted?.sourceLabel}
          readOnlySource
          onReanalyzeWithAi={onReanalyzeWithAi}
          isReanalyzing={isReanalyzing}
        />

        {error !== null ? <RecipeErrorAlert message={error} /> : null}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 p-6">
            <Button type="button" variant="outline" onClick={onReset}>
              Retour
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
