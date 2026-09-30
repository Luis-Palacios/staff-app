import { Skeleton } from "@heroui/react/skeleton";

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
          <li key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              {!isLast && (
                <span aria-hidden className="w-px flex-1 bg-separator" />
              )}
            </div>

            <div className={`flex-1 pt-2 ${isLast ? "" : "pb-8"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
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
