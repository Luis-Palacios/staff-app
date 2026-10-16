import type { ReportWeekStatus } from "@/api/small-groups-api/types";
import type { StatusBadgeProps } from "@/components/status-badge";

/** Rule 8: the order rows and count chips run in. */
export const WEEK_STATUS_ORDER: readonly ReportWeekStatus[] = [
  "notFiled",
  "today",
  "upcoming",
  "submitted",
  "notHeld",
  "noLeader",
  "noMeetingDay",
];

export type WeekBadgeStyle = {
  tone: NonNullable<StatusBadgeProps["tone"]>;
  variant: NonNullable<StatusBadgeProps["variant"]>;
};

export const WEEK_STATUS_BADGE: Record<ReportWeekStatus, WeekBadgeStyle> = {
  notFiled: { tone: "warning", variant: "ring-dot" },
  today: { tone: "accent", variant: "solid-dot" },
  upcoming: { tone: "neutral", variant: "ring-dot" },
  submitted: { tone: "success", variant: "solid-dot" },
  notHeld: { tone: "neutral", variant: "solid-dot" },
  noLeader: { tone: "neutral", variant: "ring-dot" },
  noMeetingDay: { tone: "neutral", variant: "ring-dot" },
};

/** A missed meeting is Due in the current week and Not filed in past weeks (same API status). */
export function weekStatusKey(
  status: ReportWeekStatus,
  isCurrentWeek: boolean,
): ReportWeekStatus | "due" {
  return status === "notFiled" && isCurrentWeek ? "due" : status;
}
