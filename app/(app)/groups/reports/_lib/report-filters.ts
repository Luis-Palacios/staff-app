import type { ReportListStatus } from "@/api/small-groups-api/types";

import { weekAround } from "@/lib/calendar-week";

/** The list's filters as they travel in the URL, so links and Back keep them. */
export interface ReportFilters {
  groupId: number | null;
  /** "YYYY-MM-DD"; null means the default range. */
  from: string | null;
  to: string | null;
  status: ReportListStatus;
  q: string;
  page: number;
}

export const REPORT_PAGE_SIZE = 25;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly ReportListStatus[] = ["all", "filed", "notFiled"];

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toIso(value: string | undefined): string | null {
  return value && DATE_PATTERN.test(value) ? value : null;
}

export function parseReportFilters(params: SearchParams): ReportFilters {
  const groupId = Number(first(params.groupId));
  const page = Number(first(params.page));
  const status = STATUSES.find((s) => s === first(params.status));

  return {
    groupId: Number.isInteger(groupId) && groupId > 0 ? groupId : null,
    from: toIso(first(params.from)),
    to: toIso(first(params.to)),
    status: status ?? "all",
    q: (first(params.q) ?? "").trim().slice(0, 100),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** The current week, Sunday through Saturday, around `today` ("YYYY-MM-DD", the church's today). */
export function defaultReportRange(today: string): {
  from: string;
  to: string;
} {
  const { start, end } = weekAround(today);

  return { from: start, to: end };
}

/** True when the list is narrowed beyond its defaults (decides which empty state shows). */
export function hasActiveFilters(filters: ReportFilters): boolean {
  return (
    filters.groupId !== null ||
    filters.from !== null ||
    filters.to !== null ||
    filters.status !== "all" ||
    filters.q !== ""
  );
}
