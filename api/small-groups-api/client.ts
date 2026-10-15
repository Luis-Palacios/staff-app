import type {
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
