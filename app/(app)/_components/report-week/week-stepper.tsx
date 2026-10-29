import type { Locale } from "@/lib/locale-shared";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { addDays } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { formatCalendarRange } from "@/lib/format-date";

const buttonClass =
  "flex size-10 items-center justify-center rounded-[9px] text-heading transition-colors hover:bg-default";

/**
 * Previous / range / next for the week in the URL (`?week=` is a Sunday; none = this week), on the
 * page at `basePath`. *Next* stops at `lastSunday` (default: the current week).
 */
export async function WeekStepper({
  basePath,
  weekStart,
  weekEnd,
  currentSunday,
  lastSunday = currentSunday,
}: {
  basePath: string;
  weekStart: string;
  weekEnd: string;
  currentSunday: string;
  /** The last week it may step to. */
  lastSunday?: string;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("GroupsDashboard"),
    getLocale(),
  ]);
  const previous = addDays(weekStart, -7);
  const next = addDays(weekStart, 7);
  const weekHref = (week: string) =>
    week === currentSunday ? basePath : `${basePath}?week=${week}`;

  return (
    <div
      aria-label={t("weekNav")}
      className="flex h-[46px] items-center gap-1.5 rounded-xl border border-border bg-surface p-[3px]"
      role="group"
    >
      <NextLink
        aria-label={t("previousWeek")}
        className={buttonClass}
        href={weekHref(previous)}
        scroll={false}
      >
        <ChevronLeftIcon
          aria-hidden="true"
          className="size-4"
          strokeWidth={2}
        />
      </NextLink>
      <span className="min-w-[108px] text-center text-sm font-semibold tabular-nums text-heading">
        {formatCalendarRange(weekStart, weekEnd, locale as Locale)}
      </span>
      {weekStart >= lastSunday ? (
        <button
          disabled
          aria-label={t("nextWeek")}
          className={`${buttonClass} cursor-not-allowed text-muted opacity-60 hover:bg-transparent`}
          type="button"
        >
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </button>
      ) : (
        <NextLink
          aria-label={t("nextWeek")}
          className={buttonClass}
          href={weekHref(next)}
          scroll={false}
        >
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </NextLink>
      )}
    </div>
  );
}
