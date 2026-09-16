import type { AdminUserListItem } from "@/api/auth-api/types";

import { Chip } from "@heroui/react";

export function UserStatusChips({
  user,
}: {
  user: Pick<AdminUserListItem, "banned" | "emailVerified">;
}) {
  if (!user.banned && user.emailVerified) {
    return <Chip color="success">Active</Chip>;
  }

  return (
    <>
      {user.banned && <Chip color="danger">Banned</Chip>}
      {!user.emailVerified && <Chip color="warning">Unverified</Chip>}
    </>
  );
}
