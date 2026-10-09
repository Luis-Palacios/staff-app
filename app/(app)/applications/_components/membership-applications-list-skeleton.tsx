import { Skeleton } from "@heroui/react/skeleton";

import CardSkeletonList from "@/components/skeleton/card-skeleton-list";
import TableSkeleton from "@/components/skeleton/table-skeleton";

export default function MembershipApplicationsListSkeleton() {
  return (
    <>
      {/* Toolbar: status segments, then the filter input. */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-[42px] w-72 rounded-[10px]" />
        <Skeleton className="h-10 w-full rounded-control sm:ml-auto sm:w-[300px]" />
      </div>
      <div className="hidden md:block">
        <TableSkeleton columns={6} rows={10} />
      </div>
      <div className="grid gap-3 md:hidden">
        <CardSkeletonList cardsLength={3} />
      </div>
    </>
  );
}
