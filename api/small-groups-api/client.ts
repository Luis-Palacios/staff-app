import type {
  AddGuestInput,
  NoMeetingInput,
  RemoveGuestInput,
  ReportDetail,
  ReportInput,
  ReportList,
  ReportListParams,
  ReportRoster,
  ReportShared,
  ReportSummaryGroup,
  ReportWeek,
  SmallGroupDetail,
  SmallGroupInput,
  SmallGroupRole,
  SmallGroupSummary,
} from "@/api/small-groups-api/types";

import { cache } from "react";

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
  changes: Partial<Omit<SmallGroupInput, "audience">>,
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

/**
 * The member joins on `joinedAt` ("YYYY-MM-DD", default today). 409: closed, already in the group,
 * already has a leader, or the date overlaps an earlier period; 422: a future date.
 */
export function addSmallGroupMember(
  groupId: string,
  memberId: number,
  role: SmallGroupRole,
  joinedAt?: string,
): Promise<SmallGroupDetail> {
  return authenticatedFetch<SmallGroupDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(groupId, "/members"),
    { method: "POST", body: { memberId, role, joinedAt } },
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

/** Ends the membership today (kept as history), optionally with a reason. 204. */
export function removeSmallGroupMember(
  groupId: string,
  memberId: number,
  input?: Pick<RemoveGuestInput, "leftReason">,
): Promise<void> {
  return authenticatedFetch<void>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    memberPath(groupId, memberId),
    { method: "DELETE", ...(input ? { body: input } : {}) },
  );
}

/**
 * Adds a guest to a guest group: an existing one (`guestId`) or a new one (`newGuest`, needs
 * `guests: create`). 409 `in another group` carries `otherGroup`; send `moveFromOtherGroup: true`
 * once the user confirmed. Returns the group with the guest in it, and the guest's id.
 */
export function addSmallGroupGuest(
  groupId: string,
  input: AddGuestInput,
): Promise<SmallGroupDetail & { guestId: number }> {
  return authenticatedFetch<SmallGroupDetail & { guestId: number }>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(groupId, "/guests"),
    { method: "POST", body: input },
  );
}

/** Ends the guest's period (today, or `leftAt`); the row is kept as history. 204. */
export function removeSmallGroupGuest(
  groupId: string,
  guestId: number,
  input?: RemoveGuestInput,
): Promise<void> {
  return authenticatedFetch<void>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(groupId, `/guests/${guestId}`),
    { method: "DELETE", ...(input ? { body: input } : {}) },
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

/**
 * Per open group in scope: the last report, the not-filed dates, whether it has a leader and its
 * recent meetings. Cached per render, so the follow-up card and My groups make one request.
 */
export const getSmallGroupReportSummary = cache(
  (): Promise<ReportSummaryGroup[]> =>
    authenticatedFetch<ReportSummaryGroup[]>(
      getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
      "/small-group-reports/summary",
      { cache: "no-store" },
    ),
);

/**
 * Every open group's report status for the Sunday–Saturday week containing `date`
 * ("YYYY-MM-DD"; default: the church's today). Admins and elders only; 422 for a later week.
 */
export function getSmallGroupReportWeek(date?: string): Promise<ReportWeek> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";

  return authenticatedFetch<ReportWeek>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/small-group-reports/week${query}`,
    { cache: "no-store" },
  );
}

/**
 * The prayer, praise and follow-up texts of the held reports in the Sunday–Saturday week containing
 * `date` (default: the church's today), and the groups still to report. Scoped to the caller's
 * groups; 422 for a later week.
 */
export function getSmallGroupReportShared(
  date?: string,
): Promise<ReportShared> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";

  return authenticatedFetch<ReportShared>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/small-group-reports/shared${query}`,
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
  body: ReportInput | NoMeetingInput,
): Promise<ReportDetail> {
  return authenticatedFetch<ReportDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    groupPath(groupId, "/reports"),
    { method: "POST", body },
  );
}

/**
 * Replaces the whole report; the submitter and time never change. A held report takes a
 * `ReportInput`, a no meeting a `NoMeetingInput`; 422 if the kind would change.
 */
export function updateSmallGroupReport(
  id: number | string,
  body: ReportInput | NoMeetingInput,
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
