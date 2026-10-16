import { Skeleton } from "@heroui/react/skeleton";

import CardSkeletonList from "@/components/skeleton/card-skeleton-list";
import TableSkeleton from "@/components/skeleton/table-skeleton";

export default function ReportsListSkeleton() {
  return (
    <>
      {/* Toolbar: group, dates, status and search. */}
      <Skeleton className="h-10 w-full rounded-control md:w-[520px]" />
      <div className="hidden md:block">
        <TableSkeleton columns={5} rows={8} />
      </div>
      <div className="grid gap-3 md:hidden">
        <CardSkeletonList cardsLength={3} />
      </div>
    </>
  );
}
