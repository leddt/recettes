import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type CreateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId?: Id<"recipes">;
  onCreated?: (collectionId: Id<"collections">) => void;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Une erreur inattendue s'est produite.";
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  recipeId,
  onCreated,
}: CreateCollectionDialogProps) {
  const createCollection = useMutation(api.collections.createWithOptionalRecipe);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const collectionId = await createCollection({ name, recipeId });
      toast.success(`Collection « ${name.trim()} » créée.`, {
        position: "top-right",
      });
      onCreated?.(collectionId);
      resetForm();
      onOpenChange(false);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && isSubmitting) {
          eventDetails.cancel();
          return;
        }
        if (!nextOpen) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle collection</DialogTitle>
          <DialogDescription>
            {recipeId !== undefined
              ? "Créez une collection et ajoutez-y cette recette."
              : "Donnez un nom à votre nouvelle collection."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={error !== null}>
              <FieldLabel htmlFor="create-collection-name">Nom</FieldLabel>
              <Input
                id="create-collection-name"
                value={name}
                onChange={(event) => {
                  setError(null);
                  setName(event.target.value);
                }}
                placeholder="Ex. Plats d'été"
                autoFocus
                disabled={isSubmitting}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || name.trim().length === 0}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
