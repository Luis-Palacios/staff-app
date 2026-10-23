import type { ReportSectionKey } from "@/api/small-groups-api/types";

import { Suspense } from "react";
import { LinkIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { parseWeekParam } from "../_lib/week-param";

import { TodayDate } from "./dashboard-greeting";
import { NoGroupsCard } from "./no-groups-card";
import { PrayerFilter } from "./prayer/prayer-filter";
import { PrayerSection, sectionEntries } from "./prayer/prayer-section";
import { PrayerSkeleton } from "./prayer/prayer-skeleton";
import { StillToReportNote } from "./prayer/still-to-report-note";
import { WeekStepper } from "./report-week/week-stepper";
import { weekTitle } from "./report-week/week-title";

import { getMe } from "@/api/members-api/client";
import {
  getSmallGroupReportShared,
  getSmallGroupReportSummary,
} from "@/api/small-groups-api/client";
import { EmptyState } from "@/components/empty-state";
import { textLink, title } from "@/components/primitives";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { weekAround } from "@/lib/calendar-week";
import { getChurchToday } from "@/lib/church-time";

const perSection = <T,>(
  value: (key: ReportSectionKey) => T,
): Record<ReportSectionKey, T> => ({
  prayer: value("prayer"),
  praise: value("praise"),
  followUp: value("followUp"),
});

const FILTER_LABELS = {
  prayer: "filterPrayer",
  praise: "filterPraise",
  followUp: "filterFollowUp",
} as const satisfies Record<ReportSectionKey, string>;

/**
 * The week: its title and stepper, the filter chips, the still-to-report note and the three
 * sections. A failed read throws to the page's error boundary.
 */
async function PrayerWeek({
  requestedSunday,
  scoped,
}: {
  /** The Sunday the URL asked for; null for the current week. */
  requestedSunday: string | null;
  scoped: boolean;
}) {
  const [t, shared, groups] = await Promise.all([
    getTranslations("PrayerDashboard"),
    getSmallGroupReportShared(requestedSunday ?? undefined),
    // Cached per render; it holds the open groups in scope, which the shared texts can't tell.
    getSmallGroupReportSummary(),
  ]);

  if (groups.length === 0) {
    if (!scoped) return <NoGroupsCard />;

    const tPage = await getTranslations("ReportsPage");

    return (
      <EmptyState
        className="max-w-[640px]"
        icon={UserGroupIcon}
        title={tPage("noGroupsTitle")}
      >
        {tPage("noGroupsBody")}
      </EmptyState>
    );
  }

  const { weekStart, weekEnd, isCurrentWeek, entries } = shared;
  const currentSunday = weekAround(shared.today).start;
  const heading = await weekTitle({ weekStart, currentSunday, isCurrentWeek });
  // Leaders go to My groups (no week there); everyone else to Report status for the same week.
  const statusHref = scoped || isCurrentWeek ? "/" : `/?week=${weekStart}`;
  const bySection = perSection((key) => sectionEntries(entries, key));

  return (
    <>
      <section
        aria-labelledby="prayer-week"
        className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3"
      >
        <div className="flex flex-col gap-0.5">
          <h2
            className={title({ size: "sm", className: "text-[26px]" })}
            id="prayer-week"
          >
            {heading}
          </h2>
          <p className="text-sm text-muted">{t("weekSub")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3">
          <NextLink
            className={textLink({ className: "text-sm" })}
            href={statusHref}
          >
            {scoped ? t("myGroupsLink") : t("reportStatusLink")}
          </NextLink>
          <WeekStepper
            basePath="/dashboard/prayer"
            currentSunday={currentSunday}
            isCurrentWeek={isCurrentWeek}
            weekEnd={weekEnd}
            weekStart={weekStart}
          />
        </div>
      </section>

      <PrayerFilter
        allLabel={t("filterAll")}
        chips={perSection((key) => ({
          label: t(FILTER_LABELS[key]),
          count: bySection[key].length,
        }))}
        label={t("filterLabel")}
        note={
          <StillToReportNote
            groups={shared.stillToReport}
            href={statusHref}
            isCurrentWeek={isCurrentWeek}
            scoped={scoped}
          />
        }
        sections={perSection((key) => (
          <PrayerSection
            entries={bySection[key]}
            isCurrentWeek={isCurrentWeek}
            scoped={scoped}
            section={key}
            weekEnd={weekEnd}
            weekStart={weekStart}
          />
        ))}
      />
    </>
  );
}

/**
 * Dashboard ▸ Prayer & follow-up: the week's prayer requests, praise and follow-up items from
 * every group's report, or from a leader's own groups (`scoped`).
 */
export async function PrayerDashboard({
  scoped,
  week,
}: {
  scoped: boolean;
  /** The raw `?week=` value. */
  week: string | string[] | undefined;
}) {
  const [t, tPage, me] = await Promise.all([
    getTranslations("PrayerDashboard"),
    getTranslations("ReportsPage"),
    getMe(),
  ]);
  const requestedSunday = parseWeekParam(week, getChurchToday());

  return (
    <>
      <StaffAppPageHeader
        description={scoped ? t("subtitleLeader") : t("subtitle")}
        eyebrow={<TodayDate />}
        title={t("title")}
      />
      <div className="flex flex-col gap-6">
        {/* A scoped account with no member has no groups to show (access rule 10). */}
        {scoped && me.member === null ? (
          <EmptyState
            className="max-w-[640px]"
            icon={LinkIcon}
            title={tPage("notLinkedTitle")}
          >
            {tPage("notLinkedBody")}
          </EmptyState>
        ) : (
          <Suspense
            key={requestedSunday ?? "current"}
            fallback={<PrayerSkeleton />}
          >
            <PrayerWeek requestedSunday={requestedSunday} scoped={scoped} />
          </Suspense>
        )}
      </div>
    </>
  );
}
