import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import { RecipeForm } from "@/components/recipes/form/recipe-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ExtractedRecipe, RecipeDraft } from "@/lib/recipe-types";

type ImportReviewStepProps = {
  draft: RecipeDraft;
  extracted: ExtractedRecipe | null;
  error: string | null;
  isReanalyzing: boolean;
  isSaving: boolean;
  onDraftChange: (draft: RecipeDraft) => void;
  onReanalyzeWithAi: (userInstructions?: string) => void | Promise<void>;
  onReset: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ImportReviewStep({
  draft,
  extracted,
  error,
  isReanalyzing,
  isSaving,
  onDraftChange,
  onReanalyzeWithAi,
  onReset,
  onSave,
}: ImportReviewStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Revoir la recette
        </h1>
        <p className="text-sm text-muted-foreground">
          Corrigez les informations extraites avant de les enregistrer.
        </p>
      </header>

      <form onSubmit={onSave} className="flex flex-col gap-6">
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

        <div className="flex justify-between gap-3">
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
      </form>
    </div>
  );
}
