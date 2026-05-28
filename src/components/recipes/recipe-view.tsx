import { useQuery } from "convex/react";
import { ChefHat, MessageCircle } from "lucide-react";
import { useState } from "react";

import { RecipeChatSheet } from "@/components/recipes/chat/recipe-chat-sheet";
import { useRecipeChatConversations } from "@/components/recipes/chat/use-recipe-chat";
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
  const [chatOpen, setChatOpen] = useState(false);
  const recipe = useQuery(api.recipes.get, { id: recipeId });
  const { conversations } = useRecipeChatConversations(recipeId);
  const conversationCount = conversations?.length ?? 0;

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
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
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
      </div>

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
