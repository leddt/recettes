import { Plus } from "lucide-react";

import {
  addEmptyIngredient,
  RecipeIngredientsEditor,
} from "@/components/recipes/form/recipe-ingredients-editor";
import { RecipeGeneralFields } from "@/components/recipes/form/recipe-general-fields";
import {
  addEmptyStep,
  RecipeStepsEditor,
} from "@/components/recipes/form/recipe-steps-editor";
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

type RecipeFormProps = {
  value: RecipeDraft;
  onChange: (value: RecipeDraft) => void;
  sourceUrl?: string;
  sourceLabel?: string;
  readOnlySource?: boolean;
  onReanalyzeWithAi?: (userInstructions?: string) => void | Promise<void>;
  isReanalyzing?: boolean;
};

export function RecipeForm({
  value,
  onChange,
  sourceUrl,
  sourceLabel,
  readOnlySource = false,
  onReanalyzeWithAi,
  isReanalyzing = false,
}: RecipeFormProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Nom, temps de préparation, tags et notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecipeGeneralFields
            value={value}
            onChange={onChange}
            sourceUrl={sourceUrl}
            sourceLabel={sourceLabel}
            readOnlySource={readOnlySource}
            onReanalyzeWithAi={onReanalyzeWithAi}
            isReanalyzing={isReanalyzing}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingrédients</CardTitle>
          <CardDescription>Quantité et unité sont optionnelles.</CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(addEmptyIngredient(value))}
            >
              <Plus data-icon="inline-start" />
              Ajouter
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <RecipeIngredientsEditor value={value} onChange={onChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Étapes</CardTitle>
          <CardDescription>
            Décrivez la préparation étape par étape.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(addEmptyStep(value))}
            >
              <Plus data-icon="inline-start" />
              Ajouter
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <RecipeStepsEditor value={value} onChange={onChange} />
        </CardContent>
      </Card>
    </div>
  );
}
