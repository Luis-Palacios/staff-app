import type {
  MemberDetail,
  MemberInput,
  MemberSummary,
} from "@/api/members-api/types";

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
