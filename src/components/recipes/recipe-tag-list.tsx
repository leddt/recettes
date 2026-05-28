import { Badge } from "@/components/ui/badge";

type RecipeTagListProps = {
  tags: string[];
};

export function RecipeTagList({ tags }: RecipeTagListProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag}>
          <Badge variant="secondary">{tag}</Badge>
        </li>
      ))}
    </ul>
  );
}
