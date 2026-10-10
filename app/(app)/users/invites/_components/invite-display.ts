import type { AdminInviteListItem } from "@/api/auth-api/types";

// Shared by the invites table and the mobile cards.

export function inviteEmail(invite: AdminInviteListItem): string {
  return invite.emails?.[0] ?? invite.email ?? "—";
}

export function inviterLabel(invite: AdminInviteListItem): string {
  return invite.inviterName ?? invite.inviterEmail ?? "—";
}

// Only the person who sent a still-pending invite can cancel it.
export function cancelToken(
  invite: AdminInviteListItem,
  currentUserId: string,
): string | null {
  return invite.status === "pending" &&
    invite.createdByUserId === currentUserId &&
    invite.token
    ? invite.token
    : null;
}
