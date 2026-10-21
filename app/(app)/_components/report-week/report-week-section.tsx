import type { ReportWeek } from "@/api/small-groups-api/types";
import type { Settled } from "@/lib/settle";
import type { Locale } from "@/lib/locale-shared";

import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { NoGroupsCard } from "../no-groups-card";

import { buildWeekRows } from "./week-rows";
import { WeekBrowser } from "./week-browser";
import { buildWeekPills } from "./week-counts";
import { WeekStepper } from "./week-stepper";

import { addDays } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { textLink, title } from "@/components/primitives";
import { weekAround } from "@/lib/calendar-week";
import { formatCalendarShortDate } from "@/lib/format-date";

/**
 * **The week**: every open group's report status for a Sunday–Saturday week, with a stepper to
 * move between weeks. The header and stepper come from the requested week, so they stay when
 * the call fails and another week can be picked. With no open groups, the "No groups yet" card
 * takes the place of the whole block (rule 3).
 */
export async function ReportWeekSection({
  week,
  requestedSunday,
  today,
}: {
  week: Promise<Settled<ReportWeek>>;
  /** The Sunday the URL asked for; null for the current week. */
  requestedSunday: string | null;
  /** The church's today ("YYYY-MM-DD"). */
  today: string;
}) {
  const [result, t, locale] = await Promise.all([
    week,
    getTranslations("GroupsDashboard"),
    getLocale(),
  ]);

  if (result.ok && result.value.groups.length === 0) return <NoGroupsCard />;

  // The API's dates are the truth once it answers; until then the URL's week is.
  const currentSunday = weekAround(
    result.ok ? result.value.today : today,
  ).start;
  const weekStart = result.ok
    ? result.value.weekStart
    : (requestedSunday ?? currentSunday);
  const weekEnd = result.ok ? result.value.weekEnd : addDays(weekStart, 6);
  const isCurrentWeek = result.ok
    ? result.value.isCurrentWeek
    : weekStart === currentSunday;
  const heading = isCurrentWeek
    ? t("thisWeek")
    : weekStart === addDays(currentSunday, -7)
      ? t("lastWeek")
      : t("weekOf", {
          date: formatCalendarShortDate(weekStart, locale as Locale),
        });
  const [rows, pills] = result.ok
    ? await Promise.all([
        buildWeekRows(result.value),
        buildWeekPills(result.value),
      ])
    : [[], []];

  return (
    <section aria-labelledby="week" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <h2 className={title({ size: "sm" })} id="week">
            {heading}
          </h2>
          <p className="text-sm text-muted">{t("weekDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3">
          <NextLink
            className={textLink({ className: "text-sm" })}
            href="/groups/reports"
          >
            {t("allReports")}
          </NextLink>
          <WeekStepper
            currentSunday={currentSunday}
            isCurrentWeek={isCurrentWeek}
            weekEnd={weekEnd}
            weekStart={weekStart}
          />
        </div>
      </div>

      {result.ok ? (
        <>
          <WeekBrowser
            labels={{
              weekSummary: t("weekSummary"),
              colGroup: t("colGroup"),
              colStatus: t("colStatus"),
              colAttendance: t("colAttendance"),
              colObservations: t("colObservations"),
              colActions: t("colActions"),
              noLeader: t("noLeader"),
            }}
            noMatches={t("searchNoMatches")}
            pills={pills}
            pillsLabel={t("weekSummary")}
            rows={rows}
            searchLabel={t("searchLabel")}
            searchPlaceholder={t("searchPlaceholder")}
          />
        </>
      ) : (
        <p className="text-sm text-muted">{t("weekLoadFailed")}</p>
      )}
    </section>
  );
}
