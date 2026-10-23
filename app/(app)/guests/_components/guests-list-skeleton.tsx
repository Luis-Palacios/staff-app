import { Skeleton } from "@heroui/react/skeleton";

export default function GuestsListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-80 max-w-full rounded-lg" />
        <Skeleton className="h-10 w-[340px] max-w-full rounded-lg" />
      </div>
      <Skeleton className="h-72 w-full rounded-card" />
    </div>
  );
}
