import type {
  AdminInviteListItem,
  AdminUserListItem,
} from "@/api/auth-api/types";
import type { MemberSummary } from "@/api/members-api/types";

export type AccountStatus = "linked" | "invited" | "none";

function sameEmail(a: string | null | undefined, b: string | null | undefined) {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** The pending invite addressed to the member's email, if any. */
export function getPendingInvite(
  member: Pick<MemberSummary, "email">,
  invites: readonly AdminInviteListItem[],
): AdminInviteListItem | undefined {
  return invites.find(
    (invite) =>
      invite.status === "pending" &&
      new Date(invite.expiresAt).getTime() > Date.now() &&
      (sameEmail(invite.email, member.email) ||
        invite.emails?.some((email) => sameEmail(email, member.email))),
  );
}

/** Linked = has a `userId`; Invited = no `userId` and a pending invite for their email. */
export function getAccountStatus(
  member: Pick<MemberSummary, "email" | "userId">,
  invites: readonly AdminInviteListItem[],
): AccountStatus {
  if (member.userId) return "linked";

  return getPendingInvite(member, invites) ? "invited" : "none";
}

/** Users whose email equals the member's and that no member is linked to. */
export function getSuggestedUsers(
  member: Pick<MemberSummary, "email">,
  users: readonly AdminUserListItem[],
  linkedUserIds: ReadonlySet<string>,
): AdminUserListItem[] {
  return users.filter(
    (user) =>
      !linkedUserIds.has(user.id) && sameEmail(user.email, member.email),
  );
}

/** The mirror for the User side: members with no `userId` and the user's email. */
export function getSuggestedMembers(
  user: Pick<AdminUserListItem, "email">,
  members: readonly MemberSummary[],
): MemberSummary[] {
  return members.filter(
    (member) => !member.userId && sameEmail(member.email, user.email),
  );
}

export function getLinkedUserIds(
  members: readonly MemberSummary[],
): Set<string> {
  return new Set(
    members.flatMap((member) => (member.userId ? [member.userId] : [])),
  );
}
