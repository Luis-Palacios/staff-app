import type { TimelineParams } from "@/api/small-groups-api/types";

import { parseDate } from "@internationalized/date";

/** The Dates select: three presets and a custom range (`?range=`, `?from=`, `?to=`; `from` and `to` without `range` are a custom range). */
export type TimelineRangeKind = "3m" | "6m" | "year" | "custom";

export interface TimelineRange {
  kind: TimelineRangeKind;
  /** "YYYY-MM-DD", both ends included. */
  from: string;
  to: string;
}

export interface TimelineQuery {
  range: TimelineRange;
  groupId: number | null;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_YEARS = 2;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function validDate(value: string | undefined): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null;

  try {
    return parseDate(value).toString() === value ? value : null;
  } catch {
    return null;
  }
}

/** The earliest `from` the API accepts for a range ending on `to` (at most 2 years). */
export function earliestFrom(to: string): string {
  return parseDate(to)
    .subtract({ years: MAX_YEARS })
    .add({ days: 1 })
    .toString();
}

/** Whether `from`–`to` is a range the API takes: ordered, not in the future, up to 2 years. */
export function isValidRange(from: string, to: string, today: string): boolean {
  return from <= to && to <= today && from >= earliestFrom(to);
}

/** A preset's dates as of `today` (the church's): "Last 3 months" ends today and starts the day after. */
export function presetRange(
  kind: Exclude<TimelineRangeKind, "custom">,
  today: string,
): TimelineRange {
  const end = parseDate(today);
  const start =
    kind === "year"
      ? end.set({ month: 1, day: 1 })
      : end.subtract({ months: kind === "6m" ? 6 : 3 }).add({ days: 1 });

  return { kind, from: start.toString(), to: today };
}

/**
 * The URL's filters. Anything that isn't a range the API takes falls back to the default (the UI
 * checks a custom range before it changes the URL, so this only meets edited links).
 */
export function parseTimelineQuery(
  params: SearchParams,
  today: string,
): TimelineQuery {
  const groupId = Number(first(params.group));
  const kind = first(params.range);
  const from = validDate(first(params.from));
  const to = validDate(first(params.to));
  let range = presetRange("3m", today);

  if (kind === "6m" || kind === "year") range = presetRange(kind, today);
  else if (
    (kind === "custom" || kind === undefined) &&
    from &&
    to &&
    isValidRange(from, to, today)
  ) {
    // `?from=&to=` alone is a custom range too.
    range = { kind: "custom", from, to };
  }

  return {
    range,
    groupId: Number.isInteger(groupId) && groupId > 0 ? groupId : null,
  };
}

export function toTimelineParams(query: TimelineQuery): TimelineParams {
  return {
    from: query.range.from,
    to: query.range.to,
    ...(query.groupId !== null && { smallGroupId: query.groupId }),
  };
}

/** *Show 3 more months*: a custom range starting 3 months earlier, or null at the 2-year limit. */
export function extendRange(range: TimelineRange): TimelineRange | null {
  const from = parseDate(range.from).subtract({ months: 3 }).toString();
  const limit = earliestFrom(range.to);

  if (range.from <= limit) return null;

  return { kind: "custom", from: from < limit ? limit : from, to: range.to };
}
