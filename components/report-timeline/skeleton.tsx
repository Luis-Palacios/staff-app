import { Skeleton } from "@heroui/react/skeleton";

import { card } from "@/components/primitives";

/** Placeholder for the timeline card while a person's rows load. */
export function ReportTimelineSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className={card({ className: "overflow-hidden" })}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 border-b border-separator px-[22px] py-4 last:border-b-0 md:flex-row md:gap-6"
        >
          <div className="flex flex-col gap-2 md:w-[190px]">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3.5 w-36 rounded" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
