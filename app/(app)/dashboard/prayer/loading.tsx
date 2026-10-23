import { Skeleton } from "@heroui/react/skeleton";

import { PrayerSkeleton } from "../../_components/prayer/prayer-skeleton";

// The header, the chips and one section card while the page's first read is in flight.
export default function Loading() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-44 rounded" />
        <Skeleton className="h-10 w-80 max-w-full rounded" />
        <Skeleton className="h-4 w-[560px] max-w-full rounded" />
      </div>
      <PrayerSkeleton />
    </>
  );
}
