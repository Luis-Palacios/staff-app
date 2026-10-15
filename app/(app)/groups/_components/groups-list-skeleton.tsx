import { Skeleton } from "@heroui/react/skeleton";

import { card } from "@/components/primitives";

function GroupCardSkeleton() {
  return (
    <div className={card({ className: "flex flex-col gap-4 p-5" })}>
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-10 shrink-0 rounded-tile" />
        <Skeleton className="h-5 w-2/3 rounded" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-1/2 rounded" />
        <Skeleton className="h-3.5 w-1/3 rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
      <Skeleton className="mt-1 h-4 w-full rounded" />
    </div>
  );
}

export default function GroupsListSkeleton() {
  return (
    <>
      {/* Toolbar: the status tabs and the search field. */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-[42px] w-[260px] rounded-[10px]" />
        <Skeleton className="h-10 w-full rounded-control sm:ml-auto sm:w-[300px]" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <GroupCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}
