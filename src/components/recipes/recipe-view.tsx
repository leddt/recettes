import usePresence from "@convex-dev/presence/react";
import { useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  ChefHat,
  Link2,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { RecipeChatSheet } from "@/components/recipes/chat/recipe-chat-sheet";
import { useRecipeChatConversations } from "@/components/recipes/chat/use-recipe-chat";
import { RecipeDeleteDialog } from "@/components/recipes/recipe-delete-dialog";
import { RecipeErrorAlert } from "@/components/recipes/recipe-error-alert";
import { RecipeHeader } from "@/components/recipes/recipe-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecipeCookingSection } from "@/components/recipes/recipe-cooking-section";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeViewProps = {
  recipeId: Id<"recipes">;
};

function RecipeViewPresence({
  recipeId,
  userId,
}: {
  recipeId: Id<"recipes">;
  userId: Id<"users">;
}) {
  usePresence(api.presence, recipeId, userId, 5000);
  return null;
}

function RecipeViewSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type RecipeViewActionsProps = {
  recipeId: Id<"recipes">;
  conversationCount: number;
  recipeName: string;
  onAskQuestion: () => void;
  onDelete: () => void;
};

function RecipeViewActions({
  recipeId,
  conversationCount,
  recipeName,
  onAskQuestion,
  onDelete,
}: RecipeViewActionsProps) {
  const navigate = useNavigate();
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleShare() {
    try {
      await navigator.share({
        title: recipeName,
        url: window.location.href,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Adresse copiée dans le presse-papiers", {
        position: "top-right",
      });
    } catch {
      toast.error("Impossible de copier l'adresse", { position: "top-right" });
    }
  }

  return (
    <ButtonGroup>
      <Button type="button" variant="outline" onClick={onAskQuestion}>
        <MessageCircle data-icon="inline-start" />
        Poser une question
        {conversationCount > 0 ? (
          <Badge>
            {conversationCount}
          </Badge>
        ) : null}
      </Button>
      {canShare ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Partager cette recette"
                onClick={() => void handleShare()}
              />
            }
          >
            <Share2 />
          </TooltipTrigger>
          <TooltipContent>Partager cette recette</TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copier l'adresse de cette recette"
              onClick={() => void handleCopyAddress()}
            />
          }
        >
          <Link2 />
        </TooltipTrigger>
        <TooltipContent>Copier l'adresse de cette recette</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="pl-2!"
              aria-label="Autres actions"
            />
          }
        >
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => navigate(`/recipes/${recipeId}/edit`)}
          >
            <Pencil />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export function RecipeView({ recipeId }: RecipeViewProps) {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const viewer = useQuery(api.users.viewer);
  const recipe = useQuery(api.recipes.get, { id: recipeId });
  const removeRecipe = useMutation(api.recipes.remove);
  const resetCookingProgress = useMutation(api.recipes.resetCookingProgress);
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
        <Card>
          <CardContent>
            <Empty>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  const photoUrls =
    recipe.photoUrls?.filter(
      (url: string | null): url is string => url !== null,
    ) ?? [];
  const hasCookingProgress =
    recipe.ingredients.some((ingredient) => ingredient.checked === true) ||
    recipe.steps.some((step) => step.checked === true);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {viewer ? (
        <RecipeViewPresence recipeId={recipeId} userId={viewer._id} />
      ) : null}
      <RecipeHeader
        name={recipe.name}
        servings={recipe.servings}
        prepTime={recipe.prepTime}
        cookTime={recipe.cookTime}
        totalTime={recipe.totalTime}
        tags={recipe.tags}
        sourceUrl={recipe.sourceUrl}
        sourceLabel={recipe.sourceLabel}
        coverImageUrl={recipe.coverImageUrl}
        photoUrls={photoUrls}
        notes={recipe.notes}
        actions={
          <RecipeViewActions
            recipeId={recipeId}
            conversationCount={conversationCount}
            recipeName={recipe.name}
            onAskQuestion={() => setChatOpen(true)}
            onDelete={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          />
        }
      />

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

      <RecipeCookingSection
        recipeId={recipeId}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        hasCookingProgress={hasCookingProgress}
        onResetProgress={() => void resetCookingProgress({ id: recipeId })}
      />
    </div>
  );
}
