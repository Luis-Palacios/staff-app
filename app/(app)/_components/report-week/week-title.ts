import type { Locale } from "@/lib/locale-shared";

import { getLocale, getTranslations } from "next-intl/server";

import { addDays } from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { formatCalendarShortDate } from "@/lib/format-date";

/** "This week", "Last week", otherwise "Week of Oct 4": Report status and Prayer & follow-up. */
export async function weekTitle({
  weekStart,
  currentSunday,
  isCurrentWeek,
}: {
  weekStart: string;
  currentSunday: string;
  isCurrentWeek: boolean;
}): Promise<string> {
  const [t, locale] = await Promise.all([
    getTranslations("GroupsDashboard"),
    getLocale(),
  ]);

  if (isCurrentWeek) return t("thisWeek");
  if (weekStart === addDays(currentSunday, -7)) return t("lastWeek");

  return t("weekOf", {
    date: formatCalendarShortDate(weekStart, locale as Locale),
  });
}
