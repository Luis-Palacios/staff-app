import type {
  Me,
  MemberDetail,
  MemberInput,
  MemberSummary,
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
