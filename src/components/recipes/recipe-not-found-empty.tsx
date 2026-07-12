import { ChefHat } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type RecipeNotFoundEmptyProps = {
  description?: string;
};

export function RecipeNotFoundEmpty({
  description = "Cette recette n'existe plus ou n'est pas accessible.",
}: RecipeNotFoundEmptyProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ChefHat />
        </EmptyMedia>
        <EmptyTitle>Recette introuvable</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
