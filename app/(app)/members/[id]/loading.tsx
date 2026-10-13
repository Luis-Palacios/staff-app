import { Skeleton } from "@heroui/react/skeleton";

import { card } from "@/components/primitives";

// Shown while the member loads (detail and edit): header, then two cards.
export default function MemberDetailLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <Skeleton className="h-4 w-56 rounded" />
      <div className="flex items-center gap-5">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-8 w-64 max-w-full rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-5">
        <div
          className={card({
            className: "flex min-w-0 flex-[2_1_340px] flex-col gap-4 p-6",
          })}
        >
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
        <div
          className={card({
            className: "flex min-w-0 flex-[3_1_340px] flex-col gap-4 p-6",
          })}
        >
          <Skeleton className="h-6 w-56 rounded" />
          <Skeleton className="h-14 w-full rounded" />
          <Skeleton className="h-14 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
