import { RotateCcw } from "lucide-react";

import { RecipeIngredientsList } from "@/components/recipes/recipe-ingredients-list";
import { RecipeStepsList } from "@/components/recipes/recipe-steps-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecipeDraft } from "@/lib/recipe-types";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeCookingSectionProps = {
  recipeId: Id<"recipes">;
  ingredients: RecipeDraft["ingredients"];
  steps: RecipeDraft["steps"];
  hasCookingProgress: boolean;
  onResetProgress: () => void;
};

export function RecipeCookingSection({
  recipeId,
  ingredients,
  steps,
  hasCookingProgress,
  onResetProgress,
}: RecipeCookingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Préparation</CardTitle>
        <CardDescription>
          Cochez les ingrédients et les étapes au fil de la préparation
        </CardDescription>
        {hasCookingProgress ? (
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetProgress}
            >
              <RotateCcw data-icon="inline-start" />
              Tout réinitialiser
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <RecipeIngredientsList
            recipeId={recipeId}
            ingredients={ingredients}
            embedded
          />
          <RecipeStepsList recipeId={recipeId} steps={steps} embedded />
        </div>
      </CardContent>
    </Card>
  );
}
