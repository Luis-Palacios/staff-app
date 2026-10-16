import { isCalendarDate, weekAround } from "@/lib/calendar-week";

/**
 * The Sunday a `?week=` value asks for, or null for the current week: a missing or malformed
 * value, or a week after the current one (the API refuses those). Any date in a week gives that
 * week's Sunday.
 */
export function parseWeekParam(
  value: string | string[] | undefined,
  today: string,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !isCalendarDate(raw)) return null;

  const requested = weekAround(raw).start;

  // "YYYY-MM-DD" strings compare in date order.
  return requested >= weekAround(today).start ? null : requested;
}
