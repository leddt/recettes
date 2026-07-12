import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

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
    <ConfirmDestructiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supprimer cette question ?"
      description={
        <>
          La question « {conversationTitle} » et tout son historique de messages
          seront supprimés définitivement. Cette action est irréversible.
        </>
      }
      isPending={isDeleting}
      onConfirm={onConfirm}
    />
  );
}
