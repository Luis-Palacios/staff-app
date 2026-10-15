import "server-only";

import type { AdminUserListItem } from "@/api/auth-api/types";
import type { MemberDetail } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import { headers } from "next/headers";

import { ApiError } from "@/api/api-client";
import { getUser, listInvites } from "@/api/auth-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { canManageLinks } from "@/lib/auth/roles";
import { getAccountStatus, getPendingInvite } from "@/lib/members/account";

export interface MemberAccount {
  status: AccountStatus;
  /** Admins and elders see the Account card; everyone else only the pill. */
  canManage: boolean;
  /** The linked user; `null` for D2 (linked, but auth-server has no such user). */
  user: AdminUserListItem | null;
  invitedEmail: string | null;
  inviterName: string | null;
  invitedAt: string | null;
}

/**
 * What the Account card and the status pill need. Only admins and elders can read the invite list,
 * so for anyone else the status can't tell Invited from No account and falls back to No account.
 */
export async function loadMemberAccount(
  member: MemberDetail,
): Promise<MemberAccount> {
  const session = await getServerSession();
  const canManage = canManageLinks(session?.user.role);
  const cookie = (await headers()).get("cookie") ?? "";
  const none = {
    user: null,
    invitedEmail: null,
    inviterName: null,
    invitedAt: null,
  };

  if (!canManage) {
    return { ...none, status: member.userId ? "linked" : "none", canManage };
  }

  if (member.userId) {
    try {
      return {
        ...none,
        status: "linked",
        canManage,
        user: await getUser(cookie, member.userId),
      };
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.status === 400)
      ) {
        return { ...none, status: "linked", canManage };
      }

      throw error;
    }
  }

  const { invites } = await listInvites(cookie);
  const invite = getPendingInvite(member, invites);

  return {
    ...none,
    status: getAccountStatus(member, invites),
    canManage,
    invitedEmail: invite ? (invite.email ?? member.email) : null,
    inviterName: invite?.inviterName ?? null,
    invitedAt: invite?.createdAt ?? null,
  };
}
