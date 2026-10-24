import "server-only";

import type { AdminUserListItem } from "@/api/auth-api/types";
import type { MemberDetail } from "@/api/members-api/types";

import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getUser } from "@/api/auth-api/client";
import { getMember, listMembers } from "@/api/members-api/client";
import { requirePermission } from "@/lib/auth/get-permissions";

export interface UserAccount {
  user: AdminUserListItem;
  /** The member whose `userId` is this user, or `null` when none is linked. */
  member: MemberDetail | null;
}

/**
 * The user for `/users/[id]`, with the member linked to them. It needs `user: get` (auth-server's
 * `admin/get-user`) and, for the link card, `members: view`, `all` (the full members list) and
 * `link`; anyone without them gets the 404 page, so every viewer can manage the link. An unknown id shows
 * the 404 page; any other error goes to `app/(app)/error.tsx`.
 */
export const loadUser = cache(async (id: string): Promise<UserAccount> => {
  await requirePermission({ user: ["get"], members: ["view", "all", "link"] });

  const cookie = (await headers()).get("cookie") ?? "";
  let user: AdminUserListItem;

  try {
    user = await getUser(cookie, id);
  } catch (error) {
    // better-auth answers 400 for an id it can't find.
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      notFound();
    }

    throw error;
  }

  const linked = (await listMembers("all")).find(
    (member) => member.userId === id,
  );

  return {
    user,
    member: linked ? await getMember(String(linked.id)) : null,
  };
});
