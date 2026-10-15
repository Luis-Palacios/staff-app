import { Skeleton } from "@heroui/react/skeleton";

import { card } from "@/components/primitives";

// Shown while the profile loads: the header, then two cards in the page grid.
export default function MyProfileLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-8 w-64 max-w-full rounded" />
          <Skeleton className="h-4 w-72 max-w-full rounded" />
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={card({ className: "flex flex-col gap-4 p-6" })}>
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
        <div className={card({ className: "flex flex-col gap-4 p-6" })}>
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-14 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
