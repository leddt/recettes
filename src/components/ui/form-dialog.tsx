import type { FormEvent, ReactNode } from "react";

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

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  submitLabel: string;
  pendingLabel?: string;
  submitDisabled?: boolean;
  onClose?: () => void;
  preventCloseWhileSubmitting?: boolean;
  children: ReactNode;
  footerClassName?: string;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  isSubmitting,
  submitLabel,
  pendingLabel,
  submitDisabled = false,
  onClose,
  preventCloseWhileSubmitting = false,
  children,
  footerClassName = "mt-6",
}: FormDialogProps) {
  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails?: { cancel: () => void },
  ) => {
    if (!nextOpen && preventCloseWhileSubmitting && isSubmitting) {
      eventDetails?.cancel();
      return;
    }
    if (!nextOpen) {
      onClose?.();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description != null ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form onSubmit={onSubmit}>
          {children}
          <DialogFooter className={footerClassName}>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || submitDisabled}
            >
              {isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {pendingLabel ?? submitLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
