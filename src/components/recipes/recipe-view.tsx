import { useQuery } from "convex/react";
import { ChefHat } from "lucide-react";

import { RecipeHeader } from "@/components/recipes/recipe-header";
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
  const recipe = useQuery(api.recipes.get, { id: recipeId });

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
    recipe.photoUrls?.filter((url): url is string => url !== null) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
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

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecipeIngredientsList ingredients={recipe.ingredients} />
        <RecipeStepsList steps={recipe.steps} />
      </div>
    </div>
  );
}
