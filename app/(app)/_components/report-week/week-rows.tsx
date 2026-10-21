import type { ReactNode } from "react";
import type {
  ReportWeek,
  ReportWeekGroup,
  ReportWeekStatus,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { WeekBadgeStyle } from "./week-status";

import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import {
  WEEK_STATUS_BADGE,
  WEEK_STATUS_ORDER,
  weekStatusKey,
} from "./week-status";

import { addDays } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";
import { WEEKDAY_KEYS } from "@/lib/weekdays";

/** Meetings the "See meetings" link looks back over: reports rule 10's window. */
const NOT_FILED_WINDOW_DAYS = 28;

/** `/groups/reports` filtered to a group's not-filed meetings in the last 28 days. */
export function notFiledMeetingsHref(groupId: number, today: string): string {
  return `/groups/reports?groupId=${groupId}&status=notFiled&from=${addDays(today, -NOT_FILED_WINDOW_DAYS)}`;
}

export interface WeekRowView {
  id: number;
  status: ReportWeekStatus;
  name: string;
  groupHref: string;
  leaders: string | null;
  badge: WeekBadgeStyle & { label: string };
  when: string | null;
  /** A no meeting's reason. */
  reason: string | null;
  moreReports: { label: string; href: string } | null;
  attendance: { attended: number; total: number; text: ReactNode } | null;
  observations: { count: number; text: string } | null;
  action: { href: string; label: string; ariaLabel: string };
}

/** Rule 8's order: status, then group name. */
export function sortWeekGroups(
  groups: ReportWeekGroup[],
  locale: Locale,
): ReportWeekGroup[] {
  return [...groups].sort(
    (a, b) =>
      WEEK_STATUS_ORDER.indexOf(a.status) -
        WEEK_STATUS_ORDER.indexOf(b.status) ||
      a.smallGroup.name.localeCompare(b.smallGroup.name, locale),
  );
}

/** Everything a row shows, translated, so the table and the cards render the same content. */
export async function buildWeekRows(week: ReportWeek): Promise<WeekRowView[]> {
  const [t, tLeader, tDay, locale] = await Promise.all([
    getTranslations("GroupsDashboard"),
    getTranslations("LeaderDashboard"),
    getTranslations("Weekdays"),
    getLocale(),
  ]);
  const strong = (chunks: ReactNode) => (
    <strong className="font-semibold text-heading">{chunks}</strong>
  );

  return sortWeekGroups(week.groups, locale as Locale).map((group) => {
    const { smallGroup, status, reports } = group;
    const newest = reports[0];
    const key = weekStatusKey(status, week.isCurrentWeek);
    const noMeeting = status === "notHeld" && newest;
    const action =
      (status === "submitted" || status === "notHeld") && newest
        ? {
            href: `/groups/reports/${newest.id}`,
            label: status === "notHeld" ? t("view") : t("viewReport"),
          }
        : status === "notFiled"
          ? {
              href: notFiledMeetingsHref(smallGroup.id, week.today),
              label: t("seeMeetings"),
            }
          : { href: `/groups/${smallGroup.id}`, label: t("openGroup") };
    let when: string | null = null;

    if ((status === "submitted" || status === "notHeld") && newest) {
      when = formatCalendarShortWeekdayDate(
        newest.meetingDate,
        locale as Locale,
      );
    } else if (status === "noLeader" && smallGroup.meetingDay !== null) {
      when = tLeader("meets", {
        weekday: tDay(`sentence.${WEEKDAY_KEYS[smallGroup.meetingDay]}`),
      });
    } else if (status !== "noLeader" && group.meetingDate) {
      when = formatCalendarShortWeekdayDate(
        group.meetingDate,
        locale as Locale,
      );
    }

    return {
      id: smallGroup.id,
      status,
      name: smallGroup.name,
      groupHref: `/groups/${smallGroup.id}`,
      leaders:
        group.leaders.length > 0
          ? group.leaders.map((l) => l.name).join(" · ")
          : null,
      badge: { ...WEEK_STATUS_BADGE[status], label: t(`status.${key}`) },
      when,
      reason: noMeeting ? noMeeting.notHeldReason : null,
      moreReports:
        reports.length > 1
          ? {
              label: t("moreReports", { count: reports.length - 1 }),
              href: `/groups/reports?groupId=${smallGroup.id}&from=${week.weekStart}&to=${week.weekEnd}`,
            }
          : null,
      attendance: newest?.held
        ? {
            attended: newest.attendedGroupCount,
            total: newest.rosterCount,
            text: t.rich("attendance", {
              attended: newest.attendedGroupCount,
              total: newest.rosterCount,
              strong,
            }),
          }
        : null,
      observations: newest?.held
        ? {
            count: newest.observationCount,
            text: t("observations", { count: newest.observationCount }),
          }
        : null,
      action: {
        ...action,
        ariaLabel: t("actionLabel", {
          action: action.label,
          group: smallGroup.name,
        }),
      },
    };
  });
}

export function WeekGroupCell({
  row,
  noLeader,
}: {
  row: WeekRowView;
  noLeader: string;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <NextLink
        className="text-[14.5px] font-semibold text-heading hover:underline"
        href={row.groupHref}
      >
        {row.name}
      </NextLink>
      <span className="text-[13px] text-muted">{row.leaders ?? noLeader}</span>
    </span>
  );
}

export function WeekStatusCell({
  row,
  wrapReason = false,
}: {
  row: WeekRowView;
  /** Cards let the reason wrap; the table cuts it at one line. */
  wrapReason?: boolean;
}) {
  return (
    <span className="flex flex-col items-start gap-1.5">
      <StatusBadge tone={row.badge.tone} variant={row.badge.variant}>
        {row.badge.label}
      </StatusBadge>
      {row.when && (
        <span className="whitespace-nowrap text-[13px] text-muted">
          {row.when}
        </span>
      )}
      {row.reason && (
        <span
          className={
            wrapReason
              ? "text-[13px] italic text-muted"
              : "block max-w-[220px] truncate text-[13px] italic text-muted"
          }
          title={row.reason}
        >
          {row.reason}
        </span>
      )}
      {row.moreReports && (
        <NextLink
          className="whitespace-nowrap text-[13px] font-semibold text-link underline decoration-gold-500 underline-offset-4"
          href={row.moreReports.href}
        >
          {row.moreReports.label}
        </NextLink>
      )}
    </span>
  );
}

export function WeekAttendance({ row }: { row: WeekRowView }) {
  if (!row.attendance) return <span className="text-muted">—</span>;

  const { attended, total, text } = row.attendance;
  const percent = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <span className="flex flex-col gap-1.5">
      <span className="whitespace-nowrap text-muted">{text}</span>
      <span
        aria-hidden="true"
        className="block h-1.5 w-full max-w-28 overflow-hidden rounded-full bg-separator"
      >
        <span
          className="block h-full rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
      </span>
    </span>
  );
}

export function WeekObservations({ row }: { row: WeekRowView }) {
  if (!row.observations) return <span className="text-muted">—</span>;

  const { count, text } = row.observations;

  return count > 0 ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-heading">
      <ChatBubbleBottomCenterTextIcon
        aria-hidden="true"
        className="size-4"
        strokeWidth={1.7}
      />
      {text}
    </span>
  ) : (
    <span className="text-muted">{text}</span>
  );
}
