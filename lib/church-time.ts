import "server-only";

import { getEnv } from "@/lib/env/server";

/** Today's date where the church is ("YYYY-MM-DD"), the same day the API calls `church_today()`. */
export function getChurchToday(now: Date = new Date()): string {
  // The en-CA locale formats a date as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getEnv().CHURCH_TIMEZONE,
  }).format(now);
}
