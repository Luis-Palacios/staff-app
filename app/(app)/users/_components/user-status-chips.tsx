import type { AdminUserListItem } from "@/api/auth-api/types";

import { StatusBadge } from "@/components/status-badge";

export function UserStatusChips({
  user,
}: {
  user: Pick<AdminUserListItem, "banned" | "emailVerified">;
}) {
  if (!user.banned && user.emailVerified) {
    return <StatusBadge tone="success">Active</StatusBadge>;
  }

  return (
    <>
      {user.banned && <StatusBadge tone="danger">Banned</StatusBadge>}
      {!user.emailVerified && (
        <StatusBadge tone="warning" variant="ring-dot">
          Unverified
        </StatusBadge>
      )}
    </>
  );
}
