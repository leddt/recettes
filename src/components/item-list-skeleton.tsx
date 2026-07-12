import { ItemGroup } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";

type ItemListSkeletonProps = {
  count?: number;
};

export function ItemListSkeleton({ count = 2 }: ItemListSkeletonProps) {
  return (
    <ItemGroup>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-[4.5rem] w-full rounded-lg" />
      ))}
    </ItemGroup>
  );
}
