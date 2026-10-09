import type { AdminInviteListItem, InviteStatus } from "@/api/auth-api/types";

import { StatusBadge, type StatusBadgeProps } from "@/components/status-badge";

// "expired" is virtual, never persisted (see AdminInviteListItem's own comment) - a still-
// "pending" row whose expiresAt has passed is what better-invite's own /invite/list computes at
// read time; this route bypasses that endpoint, so the UI derives it the same way here.
export type DisplayInviteStatus = InviteStatus | "expired";

export function deriveInviteStatus(
  invite: Pick<AdminInviteListItem, "status" | "expiresAt">,
): DisplayInviteStatus {
  if (invite.status === "pending" && new Date(invite.expiresAt) < new Date()) {
    return "expired";
  }

  return invite.status;
}

const STATUS_LABELS: Record<DisplayInviteStatus, string> = {
  pending: "Pending",
  used: "Accepted",
  rejected: "Rejected",
  canceled: "Canceled",
  expired: "Expired",
};

// Pending is still waiting on the invitee, so it gets the hollow ring; the
// rest are final states and get a solid dot.
const STATUS_BADGES: Record<
  DisplayInviteStatus,
  Pick<StatusBadgeProps, "tone" | "variant">
> = {
  pending: { tone: "warning", variant: "ring-dot" },
  used: { tone: "success" },
  rejected: { tone: "danger" },
  canceled: { tone: "neutral" },
  expired: { tone: "warning" },
};

export function InviteStatusChip({
  invite,
}: {
  invite: Pick<AdminInviteListItem, "status" | "expiresAt">;
}) {
  const status = deriveInviteStatus(invite);

  return (
    <StatusBadge {...STATUS_BADGES[status]}>
      {STATUS_LABELS[status]}
    </StatusBadge>
  );
}
