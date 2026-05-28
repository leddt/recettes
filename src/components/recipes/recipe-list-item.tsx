import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { formatRecipeSummary } from "@/lib/recipe-types";
import type { Id } from "../../../convex/_generated/dataModel";

export type RecipeListEntry = {
  _id: Id<"recipes">;
  name: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  sourceUrl?: string;
  tags: string[];
  source?: "text" | "semantic";
};

type RecipeListItemProps = {
  recipe: RecipeListEntry;
};

export function RecipeListItem({ recipe }: RecipeListItemProps) {
  const summary = formatRecipeSummary(recipe) || "Détails à compléter";
  const tagsLine =
    recipe.tags.length > 0 ? recipe.tags.join(", ") : undefined;

  return (
    <Item variant="outline" render={<Link to={`/recipes/${recipe._id}`} />}>
      <ItemContent>
        <ItemTitle>
          {recipe.name}
          {recipe.source === "semantic" ? (
            <Badge variant="secondary">Suggestion</Badge>
          ) : null}
        </ItemTitle>
        <ItemDescription>{summary}</ItemDescription>
        {tagsLine ? <ItemDescription>{tagsLine}</ItemDescription> : null}
      </ItemContent>
    </Item>
  );
}
