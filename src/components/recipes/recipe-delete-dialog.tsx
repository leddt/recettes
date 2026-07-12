import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

type RecipeDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeName: string;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function RecipeDeleteDialog({
  open,
  onOpenChange,
  recipeName,
  isDeleting,
  onConfirm,
}: RecipeDeleteDialogProps) {
  return (
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supprimer cette recette ?"
      description={
        <>
          La recette « {recipeName} » sera définitivement supprimée, ainsi que
          ses photos et l&apos;historique des questions associées. Cette action
          est irréversible.
        </>
      }
      isPending={isDeleting}
      onConfirm={onConfirm}
    />
  );
}
