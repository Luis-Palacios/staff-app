// The care calendar's pure parts (care spec rules 50–53): what the URL says, and the days a month
// shows. Dates are church dates, "YYYY-MM-DD", handled in UTC so no time zone moves a day.

import type { CareLogKind } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import { isCalendarDate } from "@/lib/calendar-week";

export type CalendarView = "month" | "agenda";
export type CalendarFilter = "mine" | "all";

export const CALENDAR_KINDS: readonly CareLogKind[] = [
  "call",
  "message",
  "meeting",
  "visit",
  "heard",
  "note",
];

/** The URL state: `?view=&month=&filter=&group=&kind=` (rules 51–52). */
export interface CalendarQuery {
  /** `null` when the URL doesn't say: month from `md` up, agenda on phones. */
  view: CalendarView | null;
  /** "YYYY-MM" */
  month: string;
  filter: CalendarFilter;
  /** Only with `filter=all`. */
  groupId: number | null;
  kinds: CareLogKind[];
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** "2026-10" for "2026-10-15". */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** Anything the URL holds that isn't valid falls back to the default: the page never errors on it. */
export function parseCalendarQuery(
  search: SearchParams,
  today: string,
): CalendarQuery {
  const view = first(search.view);
  const month = first(search.month);
  const filter = first(search.filter);
  const group = first(search.group);
  const kinds = [search.kind ?? []].flat();
  const mine = filter !== "all";

  return {
    view: view === "month" || view === "agenda" ? view : null,
    month:
      // Years before 1900 are refused: Date.UTC reads 0–99 as 1900–1999, which would break the range.
      month &&
      /^\d{4}-\d{2}$/.test(month) &&
      Number(month.slice(0, 4)) >= 1900 &&
      isCalendarDate(`${month}-01`)
        ? month
        : monthOf(today),
    filter: mine ? "mine" : "all",
    groupId: !mine && group && /^\d+$/.test(group) ? Number(group) : null,
    kinds: CALENDAR_KINDS.filter((kind) => kinds.includes(kind)),
  };
}

/** The URL for a state: defaults are left out, so a plain link stays short. */
export function calendarHref(
  query: CalendarQuery,
  today: string,
  changes: Partial<CalendarQuery> = {},
): string {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();

  if (next.view) params.set("view", next.view);

  if (next.month !== monthOf(today)) params.set("month", next.month);

  if (next.filter === "all") {
    params.set("filter", "all");

    if (next.groupId !== null) params.set("group", String(next.groupId));
  }

  for (const kind of next.kinds) params.append("kind", kind);

  const text = params.toString();

  return text ? `/care/calendar?${text}` : "/care/calendar";
}

/** The month before or after `month`. */
export function shiftMonth(month: string, by: number): string {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + by, 1));

  return date.toISOString().slice(0, 7);
}

/** The first and last day of a month. */
export function monthBounds(month: string): { from: string; to: string } {
  const next = shiftMonth(month, 1);
  const last = new Date(`${next}-01T00:00:00Z`);

  last.setUTCDate(0);

  return { from: `${month}-01`, to: last.toISOString().slice(0, 10) };
}

/** Weeks start on Sunday in English and Monday in Spanish, like the report date picker. */
export function weekStartOf(locale: Locale): 0 | 1 {
  return locale === "es" ? 1 : 0;
}

export interface MonthDay {
  date: string;
  inMonth: boolean;
}

/** The weeks of a month's grid, whole weeks, days around the month marked `inMonth: false`. */
export function monthGrid(month: string, weekStart: 0 | 1): MonthDay[][] {
  const { from, to } = monthBounds(month);
  const first = new Date(`${from}T00:00:00Z`);
  const lead = (first.getUTCDay() - weekStart + 7) % 7;
  const start = new Date(first);

  start.setUTCDate(start.getUTCDate() - lead);

  const weeks: MonthDay[][] = [];

  for (let cursor = new Date(start); ; ) {
    const week: MonthDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = cursor.toISOString().slice(0, 10);

      week.push({ date, inMonth: date >= from && date <= to });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    weeks.push(week);

    if (cursor.toISOString().slice(0, 10) > to) break;
  }

  return weeks;
}
