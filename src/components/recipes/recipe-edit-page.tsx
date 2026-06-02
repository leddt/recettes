import { useMutation, useQuery } from "convex/react";
import { ChefHat } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { CoverPhotoPicker } from "@/components/recipes/import/cover-photo-picker";
import { RecipeForm } from "@/components/recipes/form/recipe-form";
import { RecipeCoverImage } from "@/components/recipes/recipe-cover-image";
import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  coverIndexFromRecipe,
  normalizeRecipeDraft,
  recipeDetailToDraft,
  validateRecipeDraft,
  type RecipeDraft,
} from "@/lib/recipe-types";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeEditPageProps = {
  recipeId: Id<"recipes">;
};

function RecipeEditSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function RecipeEditPage({ recipeId }: RecipeEditPageProps) {
  const navigate = useNavigate();
  const recipe = useQuery(api.recipes.get, { id: recipeId });
  const updateRecipe = useMutation(api.recipes.update);

  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const [syncedRecipeId, setSyncedRecipeId] = useState<Id<"recipes"> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (recipe && recipe._id !== syncedRecipeId) {
    setSyncedRecipeId(recipe._id);
    setDraft(recipeDetailToDraft(recipe));
    setSelectedCoverIndex(
      coverIndexFromRecipe(recipe.photos, recipe.coverImageId),
    );
  }

  if (recipe === undefined || (recipe !== null && draft === null)) {
    return <RecipeEditSkeleton />;
  }

  if (recipe === null) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChefHat />
            </EmptyMedia>
            <EmptyTitle>Recette introuvable</EmptyTitle>
            <EmptyDescription>
              Cette recette n&apos;existe plus ou l&apos;adresse est incorrecte.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (draft === null) {
    return <RecipeEditSkeleton />;
  }

  const editDraft = draft;
  const editRecipe = recipe;
  const photoUrls = (editRecipe.photoUrls ?? []).filter(
    (url): url is string => url !== null,
  );
  const showCoverCard = photoUrls.length > 0;
  const selectedCoverUrl = photoUrls[selectedCoverIndex];

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validateRecipeDraft(editDraft);
    if (validationError !== null) {
      setError(validationError);
      return;
    }

    const normalized = normalizeRecipeDraft(editDraft);
    const coverImageId =
      editRecipe.photos && editRecipe.photos.length > 0
        ? editRecipe.photos[selectedCoverIndex]
        : undefined;

    setIsSaving(true);
    try {
      await updateRecipe({
        id: recipeId,
        ...normalized,
        coverImageId,
      });
      toast.success("Recette mise à jour", { position: "top-right" });
      navigate(`/recipes/${recipeId}`, { replace: true });
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer les modifications.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-4xl font-semibold">
          Modifier la recette
        </h1>
        <p className="text-sm text-muted-foreground">
          Mettez à jour les informations de la recette.
        </p>
      </header>

      <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-6 pb-24">
        {showCoverCard ? (
          <Card>
            <CardHeader>
              <CardTitle>Image principale</CardTitle>
              <CardDescription>
                Choisissez la photo affichée dans la liste et en haut de la
                fiche.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {selectedCoverUrl ? (
                <RecipeCoverImage
                  url={selectedCoverUrl}
                  alt={editDraft.name || "Recette"}
                  className="w-full max-h-72 rounded-lg"
                />
              ) : null}
              <CoverPhotoPicker
                urls={photoUrls}
                selectedIndex={selectedCoverIndex}
                onSelect={setSelectedCoverIndex}
                altPrefix={editDraft.name || "Recette"}
              />
            </CardContent>
          </Card>
        ) : null}

        <RecipeForm
          value={editDraft}
          onChange={setDraft}
          sourceUrl={editRecipe.sourceUrl}
          sourceLabel={editRecipe.sourceLabel}
          readOnlySource
        />

        {error !== null ? <RecipeErrorAlert message={error} /> : null}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/recipes/${recipeId}`)}
            >
              Annuler
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
