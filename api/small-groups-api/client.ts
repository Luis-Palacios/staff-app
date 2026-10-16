import type {
  ReportDetail,
  ReportInput,
  ReportList,
  ReportListParams,
  ReportRoster,
  ReportSummaryGroup,
  SmallGroupDetail,
  SmallGroupInput,
  SmallGroupRole,
  SmallGroupSummary,
} from "@/api/small-groups-api/types";

import { authenticatedFetch } from "@/api/authenticated-fetch";
import { getEnv } from "@/lib/env/server";

function groupPath(id: number | string, suffix = ""): string {
  return `/small-groups/${encodeURIComponent(String(id))}${suffix}`;
}

function memberPath(groupId: number | string, memberId: number): string {
  return groupPath(groupId, `/members/${memberId}`);
}

/** Every group, open and closed, ordered by name. */
export function listSmallGroups(): Promise<SmallGroupSummary[]> {
  return authenticatedFetch<SmallGroupSummary[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/small-groups",
  );
}

export function getSmallGroup(id: string): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(id),
  );
}

export function createSmallGroup(
  input: SmallGroupInput,
): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/small-groups",
    { method: "POST", body: input },
  );
}

/** Send only the fields that changed; `null` clears an optional one. 409 when the group is closed. */
export function updateSmallGroup(
  id: string,
  changes: Partial<SmallGroupInput>,
): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(id),
    { method: "PATCH", body: changes },
  );
}

/** Ends every membership today. 409 when already closed. */
export function closeSmallGroup(id: string): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(id, "/close"),
    { method: "POST" },
  );
}

/** The member joins today. 409: closed, already in the group, or already has a leader. */
export function addSmallGroupMember(
  groupId: string,
  memberId: number,
  role: SmallGroupRole,
): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(groupId, "/members"),
    { method: "POST", body: { memberId, role } },
  );
}

/** 409: closed, or the group already has a leader. */
export function changeSmallGroupMemberRole(
  groupId: string,
  memberId: number,
  role: SmallGroupRole,
): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    memberPath(groupId, memberId),
    { method: "PATCH", body: { role } },
  );
}

/**
 * Makes the member the leader in one transaction: the current leader becomes
 * co-leader, and the member is added if they aren't in the group. 409 only
 * when the group is closed.
 */
export function setSmallGroupLeader(
  groupId: string,
  memberId: number,
): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(groupId, "/leader"),
    { method: "PUT", body: { memberId } },
  );
}

/** Ends the membership today (kept as history). 204. */
export function removeSmallGroupMember(
  groupId: string,
  memberId: number,
): Promise<void> {
  return authenticatedFetch<void>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    memberPath(groupId, memberId),
    { method: "DELETE" },
  );
}

function reportPath(id: number | string): string {
  return `/small-group-reports/${encodeURIComponent(String(id))}`;
}

/** Filed reports and not-filed meetings in the caller's scope; paged. */
export function listSmallGroupReports(
  params: ReportListParams = {},
): Promise<ReportList> {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }

  const suffix = query.size > 0 ? `?${query}` : "";

  return authenticatedFetch<ReportList>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/small-group-reports${suffix}`,
    { cache: "no-store" },
  );
}

/** Per open group in scope: the last report and the not-filed dates. */
export function getSmallGroupReportSummary(): Promise<ReportSummaryGroup[]> {
  return authenticatedFetch<ReportSummaryGroup[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/small-group-reports/summary",
    { cache: "no-store" },
  );
}

/** Who goes in a report for `date` ("YYYY-MM-DD"). 409 closed, 422 future. */
export function getReportRoster(
  groupId: number | string,
  date: string,
): Promise<ReportRoster> {
  return authenticatedFetch<ReportRoster>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `${groupPath(groupId, "/report-roster")}?date=${encodeURIComponent(date)}`,
    { cache: "no-store" },
  );
}

/** Observations are present only when `observationsVisible` (rule 9). */
export function getSmallGroupReport(
  id: number | string,
): Promise<ReportDetail> {
  return authenticatedFetch<ReportDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    reportPath(id),
    { cache: "no-store" },
  );
}

export function createSmallGroupReport(
  groupId: number | string,
  body: ReportInput,
): Promise<ReportDetail> {
  return authenticatedFetch<ReportDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(groupId, "/reports"),
    { method: "POST", body },
  );
}

/** Replaces the whole report; the submitter and time never change. */
export function updateSmallGroupReport(
  id: number | string,
  body: ReportInput,
): Promise<ReportDetail> {
  return authenticatedFetch<ReportDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    reportPath(id),
    { method: "PATCH", body },
  );
}

/** 204; the attendance rows go with it. */
export function deleteSmallGroupReport(id: number | string): Promise<void> {
  return authenticatedFetch<void>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    reportPath(id),
    { method: "DELETE" },
  );
}
