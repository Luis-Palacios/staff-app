import "server-only";

import type { AdminUserListItem } from "@/api/auth-api/types";
import type { MemberDetail } from "@/api/members-api/types";

import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getUser } from "@/api/auth-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { getMember, listMembers } from "@/api/members-api/client";
import { canManageLinks } from "@/lib/auth/permissions";

export interface UserAccount {
  user: AdminUserListItem;
  /** The member whose `userId` is this user, or `null` when none is linked. */
  member: MemberDetail | null;
}

/**
 * The user for `/users/[id]`, with the member linked to them. Like the Users list, the page is
 * for admins and elders (auth-server's `admin/get-user` refuses anyone else), so every viewer can
 * manage the link. An unknown id shows
 * the 404 page; any other error goes to `app/(app)/error.tsx`.
 */
export const loadUser = cache(async (id: string): Promise<UserAccount> => {
  const session = await getServerSession();

  if (!session || !canManageLinks(session.permissions)) redirect("/");

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

  const linked = (await listMembers()).find((member) => member.userId === id);

  return {
    user,
    member: linked ? await getMember(String(linked.id)) : null,
  };
});
