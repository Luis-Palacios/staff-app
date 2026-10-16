import type { Locale } from "@/lib/locale-shared";

import { formatCalendarShortDate } from "@/lib/format-date";

/** "Oct 11": the Sunday the church question asks about (`churchSunday` from the API, rule 12). */
export function formatChurchSunday(churchSunday: string, locale: Locale) {
  return formatCalendarShortDate(churchSunday, locale);
}
