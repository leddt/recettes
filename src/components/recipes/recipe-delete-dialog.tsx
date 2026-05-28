import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer cette recette ?</DialogTitle>
          <DialogDescription>
            La recette « {recipeName} » sera définitivement supprimée, ainsi que
            ses photos et l&apos;historique des questions associées. Cette action
            est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <>
                <Spinner data-icon="inline-start" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
