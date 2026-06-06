import { useMutation, useQuery } from "convex/react";
import { FolderOpen, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type RecipeCollectionsSubmenuProps = {
  recipeId: Id<"recipes">;
  onCreateCollection: () => void;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Une erreur inattendue s'est produite.";
}

export function RecipeCollectionsSubmenu({
  recipeId,
  onCreateCollection,
}: RecipeCollectionsSubmenuProps) {
  const collections = useQuery(api.collections.list);
  const recipeCollectionIds = useQuery(api.collections.listForRecipe, {
    recipeId,
  });
  const addRecipe = useMutation(api.collections.addRecipe);
  const removeRecipe = useMutation(api.collections.removeRecipe);

  const membershipSet = new Set(recipeCollectionIds ?? []);

  async function handleToggle(
    collectionId: Id<"collections">,
    checked: boolean,
  ) {
    try {
      if (checked) {
        await addRecipe({ recipeId, collectionId });
      } else {
        await removeRecipe({ recipeId, collectionId });
      }
    } catch (error) {
      toast.error(getErrorMessage(error), { position: "top-right" });
    }
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <FolderOpen />
        Collections
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {collections === undefined ? (
          <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>
        ) : collections.length === 0 ? (
          <DropdownMenuItem disabled>Aucune collection</DropdownMenuItem>
        ) : (
          collections.map((collection) => (
            <DropdownMenuCheckboxItem
              key={collection._id}
              checked={membershipSet.has(collection._id)}
              onCheckedChange={(checked) =>
                void handleToggle(collection._id, checked)
              }
            >
              {collection.name}
            </DropdownMenuCheckboxItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateCollection}>
          <Plus />
          Créer une collection…
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
