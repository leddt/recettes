import { useQuery } from "convex/react";
import { ExternalLink } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatIngredient,
  formatRecipeSummary,
} from "@/lib/recipe-types";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type RecipeViewProps = {
  recipeId: Id<"recipes">;
};

export function RecipeView({ recipeId }: RecipeViewProps) {
  const recipe = useQuery(api.recipes.get, { id: recipeId });

  if (recipe === undefined) {
    return (
      <p className="text-sm text-muted-foreground">Chargement de la recette...</p>
    );
  }

  if (recipe === null) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Recette introuvable</CardTitle>
          <CardDescription>
            Cette recette n&apos;existe plus ou n&apos;est pas accessible.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summary = formatRecipeSummary(recipe);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{recipe.name}</CardTitle>
          {summary.length > 0 ? (
            <CardDescription className="text-base">{summary}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {recipe.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          {recipe.sourceUrl || recipe.sourceLabel ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Source</p>
              {recipe.sourceUrl ? (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                >
                  {recipe.sourceLabel ?? recipe.sourceUrl}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {recipe.sourceLabel}
                </p>
              )}
            </div>
          ) : null}

          {recipe.notes ? (
            <>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {recipe.notes}
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingrédients</CardTitle>
            <CardDescription>
              {recipe.ingredients.length} ingrédient
              {recipe.ingredients.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient.name}-${index}`}
                  className="rounded-lg border px-4 py-3 text-sm"
                >
                  {formatIngredient(ingredient)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Préparation</CardTitle>
            <CardDescription>
              {recipe.steps.length} étape{recipe.steps.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              {recipe.steps.map((step, index) => (
                <li
                  key={`step-${index}`}
                  className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[auto_1fr]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                    {index + 1}
                  </span>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
