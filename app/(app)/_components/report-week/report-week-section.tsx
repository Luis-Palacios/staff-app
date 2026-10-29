import type { ReportWeek } from "@/api/small-groups-api/types";
import type { Settled } from "@/lib/settle";

import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { NoGroupsCard } from "../no-groups-card";

import {
  CHURCH_WIDE_BANNER_HEADING,
  ChurchWideBanner,
} from "./church-wide-banner";
import { MarkWeekButton } from "./mark-week-button";
import { markWeekCounts } from "./mark-week-counts";
import { buildWeekRows } from "./week-rows";
import { WeekBrowser } from "./week-browser";
import { buildWeekPills } from "./week-counts";
import { WeekStepper } from "./week-stepper";
import { weekTitle } from "./week-title";

import { getMe } from "@/api/members-api/client";
import { addDays } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { textLink, title } from "@/components/primitives";
import { hasPermission } from "@/lib/auth/get-permissions";
import { weekAround } from "@/lib/calendar-week";

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
  const [result, t, tWeek] = await Promise.all([
    week,
    getTranslations("GroupsDashboard"),
    getTranslations("NoMeetingWeek"),
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
  const heading = await weekTitle({ weekStart, currentSunday, isCurrentWeek });
  const [rows, pills] = result.ok
    ? await Promise.all([
        buildWeekRows(result.value),
        buildWeekPills(result.value),
      ])
    : [[], []];
  const mark = result.ok ? await markWeekAction(result.value) : null;

  return (
    <section aria-labelledby="week" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div className="flex flex-col gap-0.5">
          {/* Focusable for the moment after a church-wide mark. */}
          <h2
            className={title({ size: "sm", className: "outline-none" })}
            id="week"
            tabIndex={-1}
          >
            {heading}
          </h2>
          <p className="text-sm text-muted">{t("weekDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3 max-sm:w-full">
          {mark && (
            <MarkWeekButton
              focusAfter={[CHURCH_WIDE_BANNER_HEADING, "week"]}
              hasMember={mark.hasMember}
              target={{
                weekStart,
                weekEnd,
                counts: mark.counts,
                ...(result.ok &&
                  result.value.noMeetingWeek && {
                    existingReason: result.value.noMeetingWeek.reason,
                  }),
              }}
            />
          )}
          <NextLink
            className={textLink({ className: "text-sm" })}
            href="/groups/reports"
          >
            {t("allReports")}
          </NextLink>
          <WeekStepper
            basePath="/"
            currentSunday={currentSunday}
            // Next week too, so a cancellation can be marked ahead (church-wide no meeting).
            lastSunday={addDays(currentSunday, 7)}
            weekEnd={weekEnd}
            weekStart={weekStart}
          />
        </div>
      </div>

      {result.ok && result.value.noMeetingWeek && (
        <ChurchWideBanner
          focusAfterUndo="week"
          heading={
            isCurrentWeek
              ? tWeek("bannerThisWeek")
              : weekStart === addDays(currentSunday, 7)
                ? tWeek("bannerNextWeek")
                : tWeek("bannerOtherWeek")
          }
          week={result.value.noMeetingWeek}
          weekEnd={weekEnd}
        />
      )}

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

/**
 * The church-wide mark's button: admins and elders (`smallGroups: all` + `create`), and only while
 * a group in the week is still to mark (rules 5, 6). Null when it isn't shown.
 */
async function markWeekAction(week: ReportWeek) {
  const counts = markWeekCounts(week);

  if (
    counts.toMark === 0 ||
    !(await hasPermission({
      smallGroups: ["all"],
      smallGroupReports: ["create"],
    }))
  ) {
    return null;
  }

  let hasMember = true;

  try {
    hasMember = (await getMe()).member !== null;
  } catch {
    // Leave it enabled: the API answers 409 and the dialog says why.
  }

  return { counts, hasMember };
}
