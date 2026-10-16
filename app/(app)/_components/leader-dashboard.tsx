import type { ReportSummaryGroup } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
  UserGroupIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { Greeting, TodayDate } from "./dashboard-greeting";

import { getMe } from "@/api/members-api/client";
import { getSmallGroupReportSummary } from "@/api/small-groups-api/client";
import { NoMeetingButton } from "@/app/(app)/groups/reports/_components/no-meeting-button";
import { weekdayOf } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { EmptyState } from "@/components/empty-state";
import { card, textLink, title } from "@/components/primitives";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { StatusBadge } from "@/components/status-badge";
import { getChurchToday } from "@/lib/church-time";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";
import { WEEKDAY_KEYS } from "@/lib/weekdays";

async function GroupCard({
  summary,
  today,
  locale,
}: {
  summary: ReportSummaryGroup;
  today: string;
  locale: Locale;
}) {
  const [t, tRole, tDay] = await Promise.all([
    getTranslations("LeaderDashboard"),
    getTranslations("SmallGroupRole"),
    getTranslations("Weekdays"),
  ]);
  const { smallGroup, role, lastReport, notFiledDates } = summary;
  const meetsToday =
    smallGroup.meetingDay !== null &&
    weekdayOf(today) === smallGroup.meetingDay;
  const groupHref = `/groups/${smallGroup.id}`;

  return (
    <li className={card({ className: "flex flex-col overflow-hidden" })}>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-tile bg-accent-soft text-accent-soft-foreground">
            <UserGroupIcon aria-hidden="true" className="size-5" />
          </span>
          <NextLink
            className={title({
              size: "sm",
              className: "min-w-0 truncate text-xl hover:underline",
            })}
            href={groupHref}
          >
            {smallGroup.name}
          </NextLink>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
          {role && (
            <StatusBadge
              tone="accent"
              variant={role === "leader" ? "solid-dot" : "ring-dot"}
            >
              {tRole(role)}
            </StatusBadge>
          )}
          {smallGroup.meetingDay !== null && (
            <span>
              {t("meets", {
                weekday: tDay(
                  `sentence.${WEEKDAY_KEYS[smallGroup.meetingDay]}`,
                ),
              })}
            </span>
          )}
          {meetsToday && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[12.5px] font-semibold text-accent-foreground">
              <span
                aria-hidden="true"
                className="size-[7px] rounded-full bg-current"
              />
              {t("meetsToday")}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-0.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            {t("lastReport")}
          </span>
          {lastReport ? (
            <span className="flex flex-wrap items-baseline gap-x-2">
              <NextLink
                className={textLink({ className: "text-sm" })}
                href={`/groups/reports/${lastReport.id}`}
              >
                {formatCalendarShortWeekdayDate(lastReport.meetingDate, locale)}
              </NextLink>
              <span className="text-muted">
                {t("lastReportLine", {
                  attended: lastReport.attendedGroupCount,
                  total: lastReport.rosterCount,
                  name: lastReport.submittedBy.name,
                })}
              </span>
            </span>
          ) : (
            <span className="text-muted">{t("noReportYet")}</span>
          )}
        </div>

        {notFiledDates.map((date) => (
          <div
            key={date}
            className="flex items-center gap-2.5 rounded-xl bg-warning-soft px-3 py-2 text-[13px] text-warning-soft-foreground"
          >
            <ClockIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              {t("notFiled", {
                date: formatCalendarShortWeekdayDate(date, locale),
              })}
            </span>
            <NextLink
              className="shrink-0 font-semibold underline underline-offset-2"
              href={`/groups/reports/new?groupId=${smallGroup.id}&date=${date}`}
            >
              {t("fileIt")}
            </NextLink>
            <span aria-hidden="true">{"·"}</span>
            <NoMeetingButton
              ariaLabel={t("noMeetingLabel", {
                date: formatCalendarShortWeekdayDate(date, locale),
              })}
              label={t("noMeetingAction")}
              target={{
                groupId: smallGroup.id,
                groupName: smallGroup.name,
                date,
              }}
              variant="link"
            />
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-3 border-t border-separator bg-surface-secondary/50 px-5 py-4">
        <NextLink
          className={buttonVariants({
            variant: "primary",
            className: "flex-1 gap-2 font-semibold",
          })}
          href={`/groups/reports/new?groupId=${smallGroup.id}`}
        >
          <PlusIcon
            aria-hidden="true"
            className="size-[18px]"
            strokeWidth={1.8}
          />
          {t("newReport")}
        </NextLink>
        <NextLink
          className={buttonVariants({
            variant: "outline",
            className: "gap-1.5 font-semibold text-heading",
          })}
          href={groupHref}
        >
          {t("openGroup")}
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </NextLink>
      </div>
    </li>
  );
}

/**
 * **My groups**: each group's last report and what's still to file. Scoped roles see every group
 * they belong to, with empty states. With `ledOnly` (admins and elders on their dashboard) only
 * the groups the linked member leads or co-leads show, and nothing renders when there are none.
 */
export async function MyGroupsSection({
  ledOnly = false,
}: {
  ledOnly?: boolean;
}) {
  const [t, tPage, locale, me] = await Promise.all([
    getTranslations("LeaderDashboard"),
    getTranslations("ReportsPage"),
    getLocale(),
    getMe(),
  ]);
  const linked = me.member !== null;

  if (ledOnly && me.leads.length === 0) return null;

  const ledIds = new Set(me.leads.map(({ smallGroupId }) => smallGroupId));
  // A failed read says so in the section; the greeting still shows.
  const groups = linked
    ? await getSmallGroupReportSummary().then(
        (list) =>
          list.filter(
            (entry) =>
              entry.smallGroup.closedAt === null &&
              (!ledOnly || ledIds.has(entry.smallGroup.id)),
          ),
        () => null,
      )
    : [];
  const today = getChurchToday();

  if (ledOnly && groups?.length === 0) return null;

  return (
    <section aria-labelledby="my-groups" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className={title({ size: "sm" })} id="my-groups">
          {t("myGroups")}
        </h2>
        {groups && groups.length > 0 && (
          <NextLink
            className={textLink({ className: "text-sm" })}
            href="/groups/reports"
          >
            {t("viewMyReports")}
          </NextLink>
        )}
      </div>

      {!linked ? (
        <EmptyState
          className="max-w-[640px]"
          icon={LinkIcon}
          title={tPage("notLinkedTitle")}
        >
          {tPage("notLinkedBody")}
        </EmptyState>
      ) : groups === null ? (
        <p className="text-sm text-muted">{t("loadFailed")}</p>
      ) : groups.length === 0 ? (
        <EmptyState
          className="max-w-[640px]"
          icon={UserGroupIcon}
          title={tPage("noGroupsTitle")}
        >
          {tPage("noGroupsBody")}
        </EmptyState>
      ) : (
        <ul className="grid max-w-[1000px] gap-4 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
          {groups.map((summary) => (
            <GroupCard
              key={summary.smallGroup.id}
              locale={locale as Locale}
              summary={summary}
              today={today}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The dashboard for small group leaders and deacons: the greeting, then **My groups**. Full roles
 * keep the regular dashboard, which adds the same section when they lead a group.
 */
export async function LeaderDashboard({ firstName }: { firstName: string }) {
  const [t, tDash] = await Promise.all([
    getTranslations("LeaderDashboard"),
    getTranslations("DashboardPage"),
  ]);

  return (
    <>
      <StaffAppPageHeader
        description={t("description")}
        eyebrow={<TodayDate />}
        title={
          <Greeting
            firstName={firstName}
            salutations={{
              morning: tDash("morning"),
              afternoon: tDash("afternoon"),
              evening: tDash("evening"),
            }}
          />
        }
      />
      <MyGroupsSection />
    </>
  );
}
