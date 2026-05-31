import { useQuery } from "convex/react";
import { EyeIcon } from "lucide-react";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";

export function RecipeActivityFeed() {
  const views = useQuery(api.presence.activeRecipeViews);

  if (views === undefined || views.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeIcon className="size-5" />
          En ce moment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2 text-sm">
          {views.map((view) => (
            <li key={`${view.userId}-${view.recipeId}`}>
              <span className="font-semibold">{view.userName}</span>{" "}
              consulte la recette{" "}
              <Link
                to={`/recipes/${view.recipeId}`}
                className="font-semibold text-primary underline-offset-4 underline decoration-dotted hover:decoration-solid"
              >
                {view.recipeName}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
