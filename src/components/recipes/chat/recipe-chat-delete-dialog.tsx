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

type RecipeChatDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function RecipeChatDeleteDialog({
  open,
  onOpenChange,
  conversationTitle,
  isDeleting,
  onConfirm,
}: RecipeChatDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer cette question ?</DialogTitle>
          <DialogDescription>
            La question « {conversationTitle} » et tout son historique de messages
            seront supprimés définitivement. Cette action est irréversible.
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
