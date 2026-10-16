import "server-only";

import type { AdminUserListItem } from "@/api/auth-api/types";
import type { MemberDetail } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import { headers } from "next/headers";

import { ApiError } from "@/api/api-client";
import { getUser, listInvites, listUsers } from "@/api/auth-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { listMembers } from "@/api/members-api/client";
import { canManageLinks } from "@/lib/auth/permissions";
import {
  getAccountStatus,
  getLinkedUserIds,
  getPendingInvite,
  getSuggestedUsers,
} from "@/lib/members/account";

export interface MemberAccount {
  status: AccountStatus;
  /** Admins and elders see the Account card; everyone else only the pill. */
  canManage: boolean;
  /** The linked user; `null` for D2 (linked, but auth-server has no such user). */
  user: AdminUserListItem | null;
  invitedEmail: string | null;
  inviteToken: string | null;
  inviterName: string | null;
  invitedAt: string | null;
  /** A user, not linked to any member, who signs in with the member's email (No account only). */
  suggestedUser: { id: string; name: string; email: string } | null;
}

/**
 * What the Account card and the status pill need. Only admins and elders can read the invite list,
 * so for anyone else the status can't tell Invited from No account and falls back to No account.
 */
export async function loadMemberAccount(
  member: MemberDetail,
): Promise<MemberAccount> {
  const session = await getServerSession();
  const canManage = canManageLinks(session?.permissions);
  const cookie = (await headers()).get("cookie") ?? "";
  const none = {
    user: null,
    invitedEmail: null,
    inviteToken: null,
    inviterName: null,
    invitedAt: null,
    suggestedUser: null,
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
  const status = getAccountStatus(member, invites);
  let suggestedUser: MemberAccount["suggestedUser"] = null;

  if (status === "none" && member.email) {
    const [{ users }, members] = await Promise.all([
      listUsers(cookie),
      listMembers(),
    ]);
    const [match] = getSuggestedUsers(member, users, getLinkedUserIds(members));

    if (match) {
      suggestedUser = { id: match.id, name: match.name, email: match.email };
    }
  }

  return {
    ...none,
    status,
    suggestedUser,
    canManage,
    invitedEmail: invite ? (invite.email ?? member.email) : null,
    inviteToken: invite?.token ?? null,
    inviterName: invite?.inviterName ?? null,
    invitedAt: invite?.createdAt ?? null,
  };
}
