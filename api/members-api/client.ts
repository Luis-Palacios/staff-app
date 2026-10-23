import type {
  Me,
  MeFeatures,
  MemberDetail,
  MemberInput,
  MemberOption,
  MemberSummary,
  OwnMemberInput,
} from "@/api/members-api/types";

import { cache } from "react";

import { authenticatedFetch } from "@/api/authenticated-fetch";
import { getEnv } from "@/lib/env/server";

export function listMembers(): Promise<MemberSummary[]> {
  return authenticatedFetch<MemberSummary[]>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    "/members",
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
