import { Skeleton } from "@heroui/react/skeleton";

import { card } from "@/components/primitives";

type CardSkeletonProps = {
  cardKey: string | number;
};

// Mobile list card placeholder: avatar + name + badge, then a muted line.
export default function CardSkeleton({ cardKey: key }: CardSkeletonProps) {
  return (
    <div key={key} className={card({ className: "flex flex-col gap-3 p-4" })}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <Skeleton className="h-4 flex-1 rounded" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-2/3 rounded" />
    </div>
  );
}
