import { RecipeGeneralFields } from "@/components/recipes/form/recipe-general-fields";
import { RecipeIngredientsEditor } from "@/components/recipes/form/recipe-ingredients-editor";
import { RecipeStepsEditor } from "@/components/recipes/form/recipe-steps-editor";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
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
    <div className="flex flex-col gap-8">
      <FieldSet>
        <FieldLegend>Informations générales</FieldLegend>
        <RecipeGeneralFields
          value={value}
          onChange={onChange}
          sourceUrl={sourceUrl}
          sourceLabel={sourceLabel}
          readOnlySource={readOnlySource}
          onReanalyzeWithAi={onReanalyzeWithAi}
          isReanalyzing={isReanalyzing}
        />
      </FieldSet>

      <Separator />

      <RecipeIngredientsEditor value={value} onChange={onChange} />

      <Separator />

      <RecipeStepsEditor value={value} onChange={onChange} />
    </div>
  );
}
