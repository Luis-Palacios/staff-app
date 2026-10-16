import type { Locale } from "@/lib/locale-shared";

import { formatCalendarWeekdayDate } from "@/lib/format-date";

/** "Sunday, Oct 11": the Sunday the church question names (`churchSunday` from the API, rule 12). */
export function formatChurchSunday(churchSunday: string, locale: Locale) {
  return formatCalendarWeekdayDate(churchSunday, locale);
}
