import type { AdminInviteListItem } from "@/api/auth-api/types";

import { deriveInviteStatus } from "./invite-status-chips";

// Shared by the invites table and the mobile cards.

export function inviteEmail(invite: AdminInviteListItem): string {
  return invite.emails?.[0] ?? invite.email ?? "—";
}

export function inviterLabel(invite: AdminInviteListItem): string {
  return invite.inviterName ?? invite.inviterEmail ?? "—";
}

// Only the person who sent a still-pending invite can cancel it. An expired one is stored as
// "pending" too, so this checks the derived status, the one the badge shows.
export function cancelToken(
  invite: AdminInviteListItem,
  currentUserId: string,
): string | null {
  return deriveInviteStatus(invite) === "pending" &&
    invite.createdByUserId === currentUserId &&
    invite.token
    ? invite.token
    : null;
}
