import type {
  PersonTimeline,
  TimelineParams,
} from "@/api/small-groups-api/types";
import type {
  Me,
  MeFeatures,
  MemberDeactivateInput,
  MemberDetail,
  MemberInput,
  MemberOption,
  MemberStatusChange,
  MemberStatusFilter,
  MemberSummary,
  OwnMemberInput,
} from "@/api/members-api/types";

import { cache } from "react";

import { authenticatedFetch } from "@/api/authenticated-fetch";
import { readTimeline, timelineQuery } from "@/api/small-groups-api/client";
import { getEnv } from "@/lib/env/server";

/**
 * `status` defaults to `active`, like the API. Pass `all` when resolving who a user or invite is
 * linked to: an inactive member keeps their `userId`.
 */
export function listMembers(
  status: MemberStatusFilter = "active",
): Promise<MemberSummary[]> {
  return authenticatedFetch<MemberSummary[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members?status=${status}`,
  );
}

/** Every member's id and name (`members: search`), for pickers. Leaders may call it; no contact data. */
export function listMemberOptions(): Promise<MemberOption[]> {
  return authenticatedFetch<MemberOption[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/members/options",
  );
}

/**
 * Members whose name matches `query` (`members: view`), for the top bar search. The API applies
 * the caller's members scope (everyone, or only their groups' members) and ignores case and
 * accents. It rejects a `query` under 2 characters.
 */
export function searchMembers(query: string): Promise<MemberOption[]> {
  return authenticatedFetch<MemberOption[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/search?q=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );
}

export function getMember(id: string): Promise<MemberDetail> {
  return authenticatedFetch<MemberDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(id)}`,
  );
}

export function createMember(input: MemberInput): Promise<MemberDetail> {
  return authenticatedFetch<MemberDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/members",
    { method: "POST", body: input },
  );
}

/** Send only the fields that changed; `null` clears an optional field. */
export function updateMember(
  id: string,
  changes: Partial<MemberInput>,
): Promise<MemberDetail> {
  return authenticatedFetch<MemberDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(id)}`,
    { method: "PATCH", body: changes },
  );
}

/**
 * The signed-in user's own member (`ownProfile: update`), found from the JWT, never by id. Send
 * only the fields that changed; `null` clears all but `name`. The API rejects `email` (422).
 */
export function updateMyMember(changes: OwnMemberInput): Promise<MemberDetail> {
  return authenticatedFetch<MemberDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/me/member",
    { method: "PATCH", body: changes },
  );
}

/** Links `userId` to the member. Idempotent for the same user. */
export function linkMemberUser(
  id: string,
  userId: string,
): Promise<MemberDetail> {
  return authenticatedFetch<MemberDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(id)}/user`,
    { method: "PUT", body: { userId } },
  );
}

/** Removes only the link; idempotent. */
export function unlinkMemberUser(id: string): Promise<void> {
  return authenticatedFetch<void>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(id)}/user`,
    { method: "DELETE" },
  );
}

/** `members: setStatus`. 409 bodies carry `code` (and `groups` for `leads_group`). */
export function deactivateMember(
  id: string,
  input: MemberDeactivateInput,
): Promise<MemberDetail> {
  return authenticatedFetch<MemberDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(id)}/deactivate`,
    { method: "POST", body: input },
  );
}

/** `members: setStatus`. Active again from today; groups are not restored. */
export function reactivateMember(
  id: string,
  note?: string | null,
): Promise<MemberDetail> {
  return authenticatedFetch<MemberDetail>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(id)}/reactivate`,
    { method: "POST", body: { note: note ?? null } },
  );
}

/** `members: setStatus`, newest first. */
export function getMemberStatusHistory(
  id: string,
): Promise<MemberStatusChange[]> {
  return authenticatedFetch<MemberStatusChange[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(id)}/status-history`,
    { cache: "no-store" },
  );
}

// cache()d so a page that needs "me" in several places asks once per request.
export const getMe = cache(
  (): Promise<Me> =>
    authenticatedFetch<Me>(getEnv().APPLICATIONS_MEMBERSHIP_API_URL, "/me", {
      cache: "no-store",
    }),
);

/** The church's settings, from the same cached `/me` call. */
export async function getFeatures(): Promise<MeFeatures> {
  return (await getMe()).features;
}

/**
 * The reports a member was on or tagged in (`members: view` + members scope; 404 outside it).
 * Rows follow rule 23. 422 `range` for a bad date range.
 */
export function getMemberTimeline(
  id: number | string,
  params: TimelineParams = {},
): Promise<PersonTimeline> {
  return authenticatedFetch<PersonTimeline>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    `/members/${encodeURIComponent(String(id))}/timeline${timelineQuery(params)}`,
    { cache: "no-store" },
  ).then(readTimeline);
}
