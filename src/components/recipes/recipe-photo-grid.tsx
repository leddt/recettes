type RecipePhotoGridProps = {
  urls: string[];
  altPrefix: string;
};

export function RecipePhotoGrid({ urls, altPrefix }: RecipePhotoGridProps) {
  if (urls.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {urls.map((url, index) => (
        <li key={`${url}-${index}`} className="overflow-hidden rounded-lg border">
          <img
            src={url}
            alt={`${altPrefix} — photo ${index + 1}`}
            className="aspect-square w-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
