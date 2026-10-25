import type {
  ReportSectionKey,
  ReportSharedEntry,
} from "@/api/small-groups-api/types";

import { Suspense } from "react";
import { LinkIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { parseWeekParam } from "../_lib/week-param";

import { TodayDate } from "./dashboard-greeting";
import { NoGroupsCard } from "./no-groups-card";
import { buildPrayerSection, sectionEntries } from "./prayer/prayer-entry";
import { PrayerFilter } from "./prayer/prayer-filter";
import { prayerPanel } from "./prayer/prayer-panel";
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
import { getPermissions } from "@/lib/auth/get-permissions";
import { canSeeConversations } from "@/lib/auth/permissions";
import { weekAround } from "@/lib/calendar-week";
import { getChurchToday } from "@/lib/church-time";
import { parseSectionParam } from "@/lib/report-sections";

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
 * sections, and the conversation panel when `?report=&section=` names one of its entries. A failed
 * read throws to the page's error boundary.
 */
async function PrayerWeek({
  requestedSunday,
  scoped,
  open,
}: {
  /** The Sunday the URL asked for; null for the current week. */
  requestedSunday: string | null;
  scoped: boolean;
  /** `?report=&section=`: the thread to open, if the URL names one. */
  open: { reportId: number; section: ReportSectionKey } | null;
}) {
  const [t, shared, groups, permissions, me] = await Promise.all([
    getTranslations("PrayerDashboard"),
    getSmallGroupReportShared(requestedSunday ?? undefined),
    // Cached per render; it holds the open groups in scope, which the shared texts can't tell.
    getSmallGroupReportSummary(),
    getPermissions(),
    getMe(),
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
  // This page with the week kept (none for the current week, as usual).
  const pageHref = isCurrentWeek
    ? "/dashboard/prayer"
    : `/dashboard/prayer?week=${weekStart}`;
  const ledIds = new Set(me.leads.map(({ smallGroupId }) => smallGroupId));
  // The conversations' audience, as on Report detail: observations, or leading that group.
  const canConverse = (entry: ReportSharedEntry) =>
    canSeeConversations(permissions, ledIds.has(entry.smallGroup.id));
  const conversationHref =
    (section: ReportSectionKey) => (entry: ReportSharedEntry) =>
      canConverse(entry)
        ? `${pageHref}${isCurrentWeek ? "?" : "&"}report=${entry.reportId}&section=${section}`
        : undefined;
  const openEntry = open
    ? entries.find(
        (entry) => entry.reportId === open.reportId && canConverse(entry),
      )
    : undefined;
  const panel =
    open && openEntry
      ? await prayerPanel({
          entry: openEntry,
          section: open.section,
          linked: me.member !== null,
          closeHref: pageHref,
        })
      : null;
  const bySection = perSection((key) => sectionEntries(entries, key));
  const [prayer, praise, followUp] = await Promise.all(
    (["prayer", "praise", "followUp"] as const).map((key) =>
      buildPrayerSection({
        activeReportId:
          panel && open?.section === key ? open.reportId : undefined,
        conversationHref: conversationHref(key),
        entries: bySection[key],
        isCurrentWeek,
        scoped,
        section: key,
        weekEnd,
        weekStart,
      }),
    ),
  );
  const sections = { prayer, praise, followUp };

  return (
    // Room for the panel at 1024 and up, as on Report detail.
    <div
      className={clsx(
        "flex flex-col gap-6 transition-[padding] duration-200 ease-out motion-reduce:transition-none",
        panel && "lg:pr-[444px] min-[1200px]:pr-[484px]",
      )}
    >
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
        noMatches={t("searchNoMatches")}
        note={
          <StillToReportNote
            groups={shared.stillToReport}
            href={statusHref}
            isCurrentWeek={isCurrentWeek}
            scoped={scoped}
          />
        }
        searchLabel={t("searchLabel")}
        searchPlaceholder={t("searchPlaceholder")}
        sections={sections}
      />
      {panel}
    </div>
  );
}

/**
 * Dashboard ▸ Prayer & follow-up: the week's prayer requests, praise and follow-up items from
 * every group's report, or from a leader's own groups (`scoped`).
 */
export async function PrayerDashboard({
  scoped,
  week,
  report,
  section,
}: {
  scoped: boolean;
  /** The raw `?week=`, `?report=` and `?section=` values. */
  week: string | string[] | undefined;
  report: string | string[] | undefined;
  section: string | string[] | undefined;
}) {
  const [t, tPage, me] = await Promise.all([
    getTranslations("PrayerDashboard"),
    getTranslations("ReportsPage"),
    getMe(),
  ]);
  const requestedSunday = parseWeekParam(week, getChurchToday());
  const reportParam = Array.isArray(report) ? report[0] : report;
  const sectionKey = parseSectionParam(section);
  const open =
    reportParam && /^[1-9]\d*$/.test(reportParam) && sectionKey
      ? { reportId: Number(reportParam), section: sectionKey }
      : null;

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
            <PrayerWeek
              open={open}
              requestedSunday={requestedSunday}
              scoped={scoped}
            />
          </Suspense>
        )}
      </div>
    </>
  );
}
