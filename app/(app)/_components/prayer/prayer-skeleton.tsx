import { Skeleton } from "@heroui/react/skeleton";

import { card } from "@/components/primitives";

/** The week heading, the chips and one section card, while the week's texts load. */
export function PrayerSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-4 w-56 max-w-full rounded" />
        </div>
        <Skeleton className="h-[46px] w-56 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-full" />
        ))}
      </div>
      <div className={card({ className: "flex flex-col gap-5 p-[22px]" })}>
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-10 rounded-[11px]" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-52 rounded" />
            <Skeleton className="h-4 w-72 max-w-full rounded" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 md:flex-row md:gap-7">
            <div className="flex flex-col gap-2 md:w-60">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full max-w-[60ch] rounded" />
              <Skeleton className="h-4 w-3/4 max-w-[48ch] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
