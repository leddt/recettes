import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { RecipeCoverImage } from "@/components/recipes/recipe-cover-image";
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
  coverImageUrl?: string | null;
  photoUrls: string[];
  notes?: string;
  actions?: ReactNode;
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
  coverImageUrl,
  photoUrls,
  notes,
  actions,
}: RecipeHeaderProps) {
  const summary = formatRecipeSummary({
    servings,
    prepTime,
    cookTime,
    totalTime,
  });

  return (
    <header className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="grid sm:grid-cols-[2fr_1fr] gap-2">

        {coverImageUrl ? (
          <RecipeCoverImage
            url={coverImageUrl}
            alt={name}
            className="w-full rounded-lg sm:order-2"
          />
        ) : null}

        <div className="flex flex-col gap-2">
          {summary.length > 0 ? (
            <p className="text-sm text-muted-foreground">{summary}</p>
          ) : null}
          
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

              {photoUrls.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Photos source</p>
                  <RecipePhotoGrid urls={photoUrls} altPrefix={name} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

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
