import { useMutation, useQuery } from "convex/react";
import { ChefHat, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { RecipeChatSheet } from "@/components/recipes/chat/recipe-chat-sheet";
import { useRecipeChatConversations } from "@/components/recipes/chat/use-recipe-chat";
import { RecipeDeleteDialog } from "@/components/recipes/recipe-delete-dialog";
import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import { RecipeHeader } from "@/components/recipes/recipe-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipeIngredientsList } from "@/components/recipes/recipe-ingredients-list";
import { RecipeStepsList } from "@/components/recipes/recipe-steps-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeViewProps = {
  recipeId: Id<"recipes">;
};

function RecipeViewSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export function RecipeView({ recipeId }: RecipeViewProps) {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const recipe = useQuery(api.recipes.get, { id: recipeId });
  const removeRecipe = useMutation(api.recipes.remove);
  const { conversations } = useRecipeChatConversations(recipeId);
  const conversationCount = conversations?.length ?? 0;

  async function handleDeleteConfirm() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await removeRecipe({ id: recipeId });
      setDeleteOpen(false);
      navigate("/", { replace: true });
    } catch (error: unknown) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "La suppression a échoué.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (recipe === undefined) {
    return <RecipeViewSkeleton />;
  }

  if (recipe === null) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChefHat />
            </EmptyMedia>
            <EmptyTitle>Recette introuvable</EmptyTitle>
            <EmptyDescription>
              Cette recette n&apos;existe plus ou n&apos;est pas accessible.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const photoUrls =
    recipe.photoUrls?.filter(
      (url: string | null): url is string => url !== null,
    ) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <RecipeHeader
          name={recipe.name}
          servings={recipe.servings}
          prepTime={recipe.prepTime}
          cookTime={recipe.cookTime}
          totalTime={recipe.totalTime}
          tags={recipe.tags}
          sourceUrl={recipe.sourceUrl}
          sourceLabel={recipe.sourceLabel}
          photoUrls={photoUrls}
          notes={recipe.notes}
        />
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setChatOpen(true)}
          >
            <MessageCircle data-icon="inline-start" />
            Poser une question
            {conversationCount > 0 ? (
              <Badge variant="secondary" className="min-w-5 justify-center px-1.5">
                {conversationCount}
              </Badge>
            ) : null}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          >
            <Trash2 data-icon="inline-start" />
            Supprimer
          </Button>
        </div>
      </div>

      {deleteError ? <RecipeErrorAlert message={deleteError} /> : null}

      <RecipeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        recipeName={recipe.name}
        isDeleting={isDeleting}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <RecipeChatSheet
        recipeId={recipeId}
        recipeName={recipe.name}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecipeIngredientsList ingredients={recipe.ingredients} />
        <RecipeStepsList steps={recipe.steps} />
      </div>
    </div>
  );
}
