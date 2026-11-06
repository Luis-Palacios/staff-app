// The Conversations inbox's *Resolved in* filter (report conversations spec, rule 15, Part 1d).
// Pure (no `server-only`), so `node --test` can run it; the page passes `CHURCH_TIMEZONE`.
import { fromDate } from "@internationalized/date";

export const RESOLVED_PERIODS = ["30d", "3m", "year", "all"] as const;

export type ResolvedPeriod = (typeof RESOLVED_PERIODS)[number];

/** Left out of the URL. */
export const DEFAULT_RESOLVED_PERIOD: ResolvedPeriod = "30d";

/** `?period=`: anything unknown (or missing) is the default. */
export function parseResolvedPeriod(value: string | undefined): ResolvedPeriod {
  return (
    RESOLVED_PERIODS.find((period) => period === value) ??
    DEFAULT_RESOLVED_PERIOD
  );
}

/**
 * The API's `resolvedSince` for a period: an ISO instant in UTC (`…Z`), or `null` for *All time*.
 * *Last 3 months* is calendar months (Nov 6 → Aug 6); *This year* is 1 January 00:00 where the
 * church is, not in UTC.
 */
export function resolvedSinceFor(
  period: ResolvedPeriod,
  timeZone: string,
  at: Date = new Date(),
): string | null {
  const now = fromDate(at, timeZone);

  switch (period) {
    case "30d":
      return now.subtract({ days: 30 }).toAbsoluteString();
    case "3m":
      return now.subtract({ months: 3 }).toAbsoluteString();
    case "year":
      return now
        .set({
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          millisecond: 0,
        })
        .toAbsoluteString();
    case "all":
      return null;
  }
}
