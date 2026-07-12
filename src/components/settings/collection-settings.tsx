import { useMutation, useQuery } from "convex/react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type CollectionListItem = {
  _id: Id<"collections">;
  name: string;
  recipeCount: number;
};

function formatRecipeCount(count: number): string {
  if (count === 0) {
    return "Aucune recette";
  }
  if (count === 1) {
    return "1 recette";
  }
  return `${count} recettes`;
}

type RenameCollectionDialogProps = {
  collection: CollectionListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function RenameCollectionDialog({
  collection,
  open,
  onOpenChange,
}: RenameCollectionDialogProps) {
  const renameCollection = useMutation(api.collections.rename);
  const [name, setName] = useState(collection?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (collection === null) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await renameCollection({ collectionId: collection._id, name });
      toast.success(`Collection renommée en « ${name.trim()} ».`);
      onOpenChange(false);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Renommer la collection"
      description="Modifiez le nom de la collection."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Enregistrer"
      pendingLabel="Enregistrement..."
    >
      <FieldGroup>
        <Field data-invalid={error !== null}>
          <FieldLabel htmlFor="rename-collection-name">Nom</FieldLabel>
          <Input
            id="rename-collection-name"
            value={name}
            onChange={(event) => {
              setError(null);
              setName(event.target.value);
            }}
            required
          />
          {error !== null ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
    </FormDialog>
  );
}

type DeleteCollectionDialogProps = {
  collection: CollectionListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
}: DeleteCollectionDialogProps) {
  const removeCollection = useMutation(api.collections.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    if (collection === null) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeCollection({ collectionId: collection._id });
      toast.success(`Collection « ${collection.name} » supprimée.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supprimer cette collection ?"
      description={
        collection !== null ? (
          <>
            La collection « {collection.name} » sera définitivement
            supprimée. Les recettes qu&apos;elle contient ne seront pas
            supprimées.
          </>
        ) : null
      }
      isPending={isDeleting}
      onConfirm={() => void handleConfirm()}
    />
  );
}

function CollectionListSkeleton() {
  return (
    <ItemGroup>
      <Skeleton className="h-[4.5rem] w-full rounded-lg" />
      <Skeleton className="h-[4.5rem] w-full rounded-lg" />
    </ItemGroup>
  );
}

export function CollectionSettings() {
  const collections = useQuery(api.collections.listWithRecipeCounts);
  const [renameDialogCollection, setRenameDialogCollection] =
    useState<CollectionListItem | null>(null);
  const [deleteDialogCollection, setDeleteDialogCollection] =
    useState<CollectionListItem | null>(null);

  if (collections === undefined) {
    return <CollectionListSkeleton />;
  }

  const collectionCountLabel =
    collections.length === 1
      ? "1 collection"
      : `${collections.length} collections`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{collectionCountLabel}</p>

      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune collection pour le moment. Créez-en une depuis le menu
          Collections d&apos;une recette.
        </p>
      ) : (
        <ItemGroup>
          {collections.map((collection) => (
            <Item key={collection._id} variant="outline">
              <ItemContent>
                <ItemTitle>{collection.name}</ItemTitle>
                <ItemDescription>
                  {formatRecipeCount(collection.recipeCount)}
                </ItemDescription>
              </ItemContent>
              <ItemActions className="flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRenameDialogCollection(collection)}
                >
                  <PencilIcon />
                  Renommer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogCollection(collection)}
                >
                  <Trash2Icon />
                  Supprimer
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <RenameCollectionDialog
        key={renameDialogCollection?._id ?? "closed"}
        collection={renameDialogCollection}
        open={renameDialogCollection !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameDialogCollection(null);
          }
        }}
      />
      <DeleteCollectionDialog
        collection={deleteDialogCollection}
        open={deleteDialogCollection !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogCollection(null);
          }
        }}
      />
    </div>
  );
}
