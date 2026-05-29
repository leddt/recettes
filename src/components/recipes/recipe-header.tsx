import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { RecipeCoverImage } from "@/components/recipes/recipe-cover-image";
import { RecipePhotoGrid } from "@/components/recipes/recipe-photo-grid";
import { RecipeTagList } from "@/components/recipes/recipe-tag-list";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-4xl font-semibold">
          {name}
        </CardTitle>
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
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
      </CardContent>
    </Card>
  );
}
