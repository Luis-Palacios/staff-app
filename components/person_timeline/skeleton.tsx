import { Skeleton } from "@heroui/react/skeleton";
import clsx from "clsx";

// Mirrors the <ol>/<li> layout of PersonTimeline (rail marker + connector,
// then a title/date row) so the card doesn't jump when the data streams in.
export default function PersonTimelineSkeleton({
  items = 3,
}: {
  items?: number;
}) {
  return (
    <ol
      aria-busy="true"
      aria-label="Loading timeline"
      className="flex flex-col"
    >
      {Array.from({ length: items }).map((_, index) => {
        const isLast = index === items - 1;

        return (
          <li key={index} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <Skeleton className="size-[38px] shrink-0 rounded-full" />
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="my-1.5 min-h-[26px] w-0.5 flex-1 bg-separator"
                />
              )}
            </div>

            <div className={clsx("flex-1 pt-2", !isLast && "pb-[22px]")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
