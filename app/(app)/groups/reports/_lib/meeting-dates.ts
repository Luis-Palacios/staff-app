import type { Weekday } from "@/api/small-groups-api/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far back the meeting step looks for filed reports (the calendar dots and the default date). */
export const FILED_LOOKBACK_DAYS = 400;

/** "YYYY-MM-DD" shifted by `days`, in UTC so no time zone can move the day. */
export function addDays(iso: string, days: number): string {
  const time = Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS;

  return new Date(time).toISOString().slice(0, 10);
}

/** ISO weekday (1 = Monday … 7 = Sunday) of a "YYYY-MM-DD" date. */
export function weekdayOf(iso: string): Weekday {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();

  return (day === 0 ? 7 : day) as Weekday;
}

/**
 * The date the form starts on: the latest meeting-weekday date on or before today that has no
 * report yet (looking back eight weeks), else today. A group with no meeting day starts on today.
 */
export function defaultMeetingDate({
  today,
  meetingDay,
  filedDates,
}: {
  today: string;
  meetingDay: Weekday | null;
  filedDates: ReadonlySet<string>;
}): string {
  if (meetingDay === null) return today;

  for (let back = 0; back < 56; back += 1) {
    const date = addDays(today, -back);

    if (weekdayOf(date) === meetingDay && !filedDates.has(date)) return date;
  }

  return today;
}
