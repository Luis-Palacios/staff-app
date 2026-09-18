import type { AdminInviteListItem, InviteStatus } from "@/api/auth-api/types";

import { Chip } from "@heroui/react";

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

// Same 4-color constraint as role-display.ts (default | danger | warning | success | accent are
// the only options on HeroUI's Chip - no "secondary").
const STATUS_COLORS: Record<
  DisplayInviteStatus,
  "default" | "danger" | "warning" | "success"
> = {
  pending: "default",
  used: "success",
  rejected: "danger",
  canceled: "default",
  expired: "warning",
};

export function InviteStatusChip({
  invite,
}: {
  invite: Pick<AdminInviteListItem, "status" | "expiresAt">;
}) {
  const status = deriveInviteStatus(invite);

  return <Chip color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Chip>;
}
