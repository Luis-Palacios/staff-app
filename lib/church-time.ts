import "server-only";

import { getEnv } from "@/lib/env/server";

/** Today's date where the church is ("YYYY-MM-DD"), the same day the API calls `church_today()`. */
export function getChurchToday(now: Date = new Date()): string {
  // The en-CA locale formats a date as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getEnv().CHURCH_TIMEZONE,
  }).format(now);
}

/** "Oct 8, 2026, 9:42 PM": a timestamp read in the church's time zone, so it is the same for everyone. */
export function formatChurchDateTime(iso: string, locale: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: getEnv().CHURCH_TIMEZONE,
  }).format(date);
}
