import type { AdminUserListItem } from "@/api/auth-api/types";

import { AssignPendingRole } from "./assign-pending-role";
import { roleBadgeProps, roleLabel } from "./role-display";
import { UserStatusChips } from "./user-status-chips";

import { InitialsAvatar } from "@/components/initials-avatar";
import { LocalDate } from "@/components/local-date";
import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";

// Mobile stand-in for a table row: avatar, name and role, then the email and
// join date, the status badges, and the role picker for pending users.
export default function UserCardSummary({ user }: { user: AdminUserListItem }) {
  const isPending = user.role === "pending";

  return (
    <article className={card({ className: "flex flex-col gap-3 p-4" })}>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={user.name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-[15px] font-semibold text-heading">
            {user.name}
          </h2>
          <p className="truncate text-[13px] text-muted">{user.email}</p>
        </div>
        {!isPending && (
          <StatusBadge {...roleBadgeProps(user.role)}>
            {roleLabel(user.role)}
          </StatusBadge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-12 text-[13px] text-muted">
        <UserStatusChips user={user} />
        <span>
          Joined <LocalDate value={user.createdAt} />
        </span>
      </div>
      {user.banned && user.banReason && (
        <p className="pl-12 text-[13px] text-muted">
          Ban reason: {user.banReason}
        </p>
      )}
      {isPending && (
        <div className="pl-12">
          <AssignPendingRole userId={user.id} userName={user.name} />
        </div>
      )}
    </article>
  );
}
