import { Skeleton } from "@heroui/react/skeleton";

import { card } from "@/components/primitives";

// Shown while a report loads: header, three tiles, the shared card and the attendance card.
export default function ReportDetailLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <Skeleton className="h-4 w-56 rounded" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-9 w-80 max-w-full rounded" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
      <div className={card({ className: "flex flex-col gap-4 p-6" })}>
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-20 w-full rounded" />
      </div>
      <div className={card({ className: "flex flex-col gap-4 p-6" })}>
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-12 w-full rounded" />
        <Skeleton className="h-12 w-full rounded" />
        <Skeleton className="h-12 w-full rounded" />
      </div>
    </div>
  );
}
