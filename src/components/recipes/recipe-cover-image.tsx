import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

type RecipeCoverImageProps = {
  url?: string | null;
  alt: string;
  className?: string;
};

function CoverPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      <ChefHat className="size-5 opacity-60" />
    </div>
  );
}

export function RecipeCoverImage({
  url,
  alt,
  className,
}: RecipeCoverImageProps) {
  if (!url) {
    return (
      <CoverPlaceholder className={cn("size-full", className)} />
    );
  }
  
  return (
    <img src={url} alt={alt} className={cn("object-cover", className)} />
  );
}
