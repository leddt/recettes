import { cn } from "@/lib/utils";

type CoverPhotoPickerProps = {
  urls: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  altPrefix?: string;
};

export function CoverPhotoPicker({
  urls,
  selectedIndex,
  onSelect,
  altPrefix = "Photo",
}: CoverPhotoPickerProps) {
  if (urls.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Image principale</p>
      <p className="text-sm text-muted-foreground">
        Choisissez la photo affichée dans la liste et en haut de la fiche.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {urls.map((url, index) => (
          <button
            key={url}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              index === selectedIndex
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-muted-foreground/40",
            )}
            aria-pressed={index === selectedIndex}
            aria-label={`${altPrefix} ${index + 1} comme image principale`}
          >
            <img
              src={url}
              alt={`${altPrefix} ${index + 1}`}
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
