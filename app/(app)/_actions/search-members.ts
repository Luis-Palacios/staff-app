"use server";

import type { MemberOption } from "@/api/members-api/types";

import { searchMembers } from "@/api/members-api/client";
import { hasPermission } from "@/lib/auth/get-permissions";

/** The API refuses shorter queries (422); the top bar doesn't ask for them either. */
const MIN_QUERY_LENGTH = 2;

export type SearchMembersResult =
  | { ok: true; members: MemberOption[] }
  | { ok: false };

/**
 * The top bar search. A server action is a public endpoint, so the permission
 * and the length are checked here, not only in the UI. Who may see which
 * member is decided by the API (everyone for `members: all`, otherwise the
 * members of the caller's groups); this only keeps calls that can't succeed
 * from going out. A failure carries no text: the UI shows its own message.
 */
export async function searchMembersAction(
  query: string,
): Promise<SearchMembersResult> {
  const text = query.trim();

  if (text.length < MIN_QUERY_LENGTH) return { ok: true, members: [] };
  if (!(await hasPermission({ members: ["view"] }))) return { ok: false };

  try {
    return { ok: true, members: await searchMembers(text) };
  } catch {
    return { ok: false };
  }
}
