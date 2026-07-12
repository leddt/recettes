import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type CreateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId?: Id<"recipes">;
  onCreated?: (collectionId: Id<"collections">) => void;
};

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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle collection"
      description={
        recipeId !== undefined
          ? "Créez une collection et ajoutez-y cette recette."
          : "Donnez un nom à votre nouvelle collection."
      }
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Créer"
      submitDisabled={name.trim().length === 0}
      onClose={resetForm}
      preventCloseWhileSubmitting
      footerClassName="mt-4"
    >
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
    </FormDialog>
  );
}
