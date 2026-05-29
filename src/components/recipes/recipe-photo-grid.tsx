import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type RecipePhotoGridProps = {
  urls: string[];
  altPrefix: string;
};

export function RecipePhotoGrid({ urls, altPrefix }: RecipePhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (urls.length === 0) {
    return null;
  }

  const activeIndex = lightboxIndex ?? 0;
  const activeUrl = urls[activeIndex];
  const hasMultiple = urls.length > 1;

  return (
    <>
      <ul className="grid grid-cols-5 gap-3">
        {urls.map((url, index) => (
          <li key={`${url}-${index}`} className="overflow-hidden rounded-lg border">
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Afficher ${altPrefix} — photo ${index + 1} en plein écran`}
            >
              <img
                src={url}
                alt={`${altPrefix} — photo ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxIndex(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={cn(
            "fixed inset-0 top-0 left-0 flex h-dvh w-dvw max-w-none translate-x-0 translate-y-0",
            "flex-col items-center justify-center gap-0 rounded-none border-0 bg-black/95 p-4 ring-0 sm:max-w-none",
          )}
        >
          <DialogTitle className="sr-only">
            {altPrefix} — photo {activeIndex + 1}
            {hasMultiple ? ` sur ${urls.length}` : ""}
          </DialogTitle>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 text-white hover:bg-white/20 hover:text-white"
            onClick={() => setLightboxIndex(null)}
            aria-label="Fermer"
          >
            <X />
          </Button>

          {hasMultiple ? (
            <>
              <div className="absolute top-1/2 left-2 z-10 -translate-y-1/2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hover:text-white"
                  onClick={() =>
                    setLightboxIndex(
                      (activeIndex - 1 + urls.length) % urls.length,
                    )
                  }
                  aria-label="Photo précédente"
                >
                  <ChevronLeft />
                </Button>
              </div>
              <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 hover:text-white"
                onClick={() =>
                  setLightboxIndex((activeIndex + 1) % urls.length)
                }
                aria-label="Photo suivante"
              >
                  <ChevronRight />
                </Button>
              </div>
              <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-sm text-white/80">
                {activeIndex + 1} / {urls.length}
              </p>
            </>
          ) : null}

          <img
            src={activeUrl}
            alt={`${altPrefix} — photo ${activeIndex + 1}`}
            className="max-h-[calc(100dvh-2rem)] max-w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
