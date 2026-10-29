import { addDays } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { isCalendarDate, weekAround } from "@/lib/calendar-week";

/**
 * The Sunday a `?week=` value asks for, or null for the current week: a missing or malformed
 * value, the current week, or a week more than `weeksAhead` weeks after it (Report status allows
 * next week; Prayer & follow-up's API refuses any later week). Any date in a week gives that
 * week's Sunday.
 */
export function parseWeekParam(
  value: string | string[] | undefined,
  today: string,
  { weeksAhead = 0 }: { weeksAhead?: number } = {},
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !isCalendarDate(raw)) return null;

  const requested = weekAround(raw).start;
  const currentSunday = weekAround(today).start;

  // "YYYY-MM-DD" strings compare in date order.
  if (
    requested === currentSunday ||
    requested > addDays(currentSunday, 7 * weeksAhead)
  ) {
    return null;
  }

  return requested;
}
