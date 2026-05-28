import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";

type RecipeReanalyzeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isReanalyzing: boolean;
  onConfirm: (userInstructions?: string) => void;
};

export function RecipeReanalyzeDialog({
  open,
  onOpenChange,
  isReanalyzing,
  onConfirm,
}: RecipeReanalyzeDialogProps) {
  const [instructions, setInstructions] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setInstructions("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ré-analyser avec l&apos;IA</DialogTitle>
          <DialogDescription>
            Ajoutez des instructions pour guider l&apos;extraction (optionnel).
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          placeholder="Ex. : conserver les sous-étapes détaillées, ignorer la section dessert..."
          rows={4}
          disabled={isReanalyzing}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isReanalyzing}
            onClick={() => handleOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={isReanalyzing}
            onClick={() => {
              const trimmed = instructions.trim();
              handleOpenChange(false);
              onConfirm(trimmed.length > 0 ? trimmed : undefined);
            }}
          >
            {isReanalyzing ? (
              <>
                <Spinner data-icon="inline-start" />
                Analyse IA...
              </>
            ) : (
              "Ré-analyser"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
