import type { AdminUserListItem } from "@/api/auth-api/types";

import { Card } from "@heroui/react/card";
import { Chip } from "@heroui/react/chip";

import { AssignPendingRole } from "./assign-pending-role";
import { roleChipColor, roleLabel } from "./role-display";
import { UserStatusChips } from "./user-status-chips";

import { LocalDateTime } from "@/components/local-date-time";

export default function UserCardSummary({ user }: { user: AdminUserListItem }) {
  return (
    <Card.Root key={user.id}>
      <Card.Header>
        <Card.Title>{user.name}</Card.Title>
        <Card.Description>{user.email}</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1 text-sm">
        <div>
          Joined: <LocalDateTime value={user.createdAt} />
        </div>
        {user.banned && user.banReason && (
          <div>Ban reason: {user.banReason}</div>
        )}
      </Card.Content>
      <Card.Footer className="flex flex-wrap items-center gap-1">
        {user.role === "pending" ? (
          <AssignPendingRole userId={user.id} userName={user.name} />
        ) : (
          <Chip color={roleChipColor(user.role)}>{roleLabel(user.role)}</Chip>
        )}
        <UserStatusChips user={user} />
      </Card.Footer>
    </Card.Root>
  );
}
