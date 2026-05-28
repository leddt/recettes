import { ExternalLink } from "lucide-react";

import { RecipePhotoGrid } from "@/components/recipes/recipe-photo-grid";
import { RecipeTagList } from "@/components/recipes/recipe-tag-list";
import { Separator } from "@/components/ui/separator";
import { formatRecipeSummary } from "@/lib/recipe-types";

type RecipeHeaderProps = {
  name: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  tags: string[];
  sourceUrl?: string;
  sourceLabel?: string;
  photoUrls: string[];
  notes?: string;
};

export function RecipeHeader({
  name,
  servings,
  prepTime,
  cookTime,
  totalTime,
  tags,
  sourceUrl,
  sourceLabel,
  photoUrls,
  notes,
}: RecipeHeaderProps) {
  const summary = formatRecipeSummary({
    servings,
    prepTime,
    cookTime,
    totalTime,
  });

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        {summary.length > 0 ? (
          <p className="text-sm text-muted-foreground">{summary}</p>
        ) : null}
      </div>

      <RecipeTagList tags={tags} />

      {sourceUrl || sourceLabel ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Source</p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
            >
              {sourceLabel ?? sourceUrl}
              <ExternalLink data-icon="inline-end" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">{sourceLabel}</p>
          )}
        </div>
      ) : null}

      {photoUrls.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Photos source</p>
          <RecipePhotoGrid urls={photoUrls} altPrefix={name} />
        </div>
      ) : null}

      {notes ? (
        <>
          <Separator />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {notes}
            </p>
          </div>
        </>
      ) : null}
    </header>
  );
}
