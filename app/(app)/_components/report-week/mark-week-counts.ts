import type {
  ReportWeek,
  ReportWeekStatus,
} from "@/api/small-groups-api/types";

/** Statuses of a meeting that hasn't been reported: what a church-wide no meeting marks (rule 5). */
const TO_MARK: readonly ReportWeekStatus[] = [
  "notFiled",
  "today",
  "upcoming",
  "noLeader",
];

export interface MarkWeekCounts {
  /** Groups the mark will cover. */
  toMark: number;
  /** Groups with a report or a no meeting already, left as they are. */
  staying: number;
  /** Groups without a meeting day, skipped. */
  noDay: number;
}

/**
 * What marking the week would do, from the week already loaded (rule 13): no extra call. The API
 * decides on its own; the toast reports what it actually marked.
 */
export function markWeekCounts(week: ReportWeek): MarkWeekCounts {
  const counts: MarkWeekCounts = { toMark: 0, staying: 0, noDay: 0 };

  for (const { status, meetingDate } of week.groups) {
    if (TO_MARK.includes(status) && meetingDate !== null) counts.toMark += 1;
    else if (status === "submitted" || status === "notHeld") {
      counts.staying += 1;
    } else if (status === "noMeetingDay") counts.noDay += 1;
  }

  return counts;
}
