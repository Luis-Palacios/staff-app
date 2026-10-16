import { Skeleton } from "@heroui/react/skeleton";

import CardSkeletonList from "@/components/skeleton/card-skeleton-list";
import TableSkeleton from "@/components/skeleton/table-skeleton";

export function ReportWeekSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-4 w-72 max-w-full rounded" />
        </div>
        <Skeleton className="h-[46px] w-56 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      <div className="hidden xl:block">
        <TableSkeleton columns={5} rows={6} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-3 xl:hidden">
        <CardSkeletonList cardsLength={6} />
      </div>
    </div>
  );
}
