import type { AdminUserListItem } from "@/api/auth-api/types";
import type { LinkedMembers } from "./users-browser";

import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { AssignPendingRole } from "./assign-pending-role";
import { RoleBadge } from "./role-badge";
import { UserMemberLink } from "./user-member-link";
import { UserStatusChips } from "./user-status-chips";

import { InitialsAvatar } from "@/components/initials-avatar";
import { LocalDate } from "@/components/local-date";
import { card, textLink } from "@/components/primitives";

// Mobile stand-in for a table row: avatar, name and email, then the role and
// status badges with the join date, and the role picker for pending users.
// The role sits in the wrapping row because Spanish role names are too long
// to share the header line at phone width.
export default function UserCardSummary({
  user,
  member,
}: {
  user: AdminUserListItem;
  member?: LinkedMembers[string];
}) {
  const t = useTranslations("UserCard");
  const isPending = user.role === "pending";

  return (
    <article className={card({ className: "flex min-w-0 flex-col gap-3 p-4" })}>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={user.name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-[15px] font-semibold text-heading">
            {user.name}
          </h2>
          <p className="truncate text-[13px] text-muted">{user.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-12 text-[13px] text-muted">
        {!isPending && <RoleBadge role={user.role} />}
        <UserStatusChips user={user} />
        <span>
          {t.rich("joined", {
            date: () => <LocalDate value={user.createdAt} />,
          })}
        </span>
      </div>
      <p className="pl-12 text-[13px] text-muted">
        {t("member")} <UserMemberLink member={member} />
      </p>
      {user.banned && user.banReason && (
        <p className="pl-12 text-[13px] text-muted">
          {t("banReason", { reason: user.banReason })}
        </p>
      )}
      <div className="pl-12">
        <NextLink
          className={textLink({ className: "text-sm" })}
          href={`/users/${user.id}`}
        >
          {t("open")}
        </NextLink>
      </div>
      {isPending && (
        <div className="pl-12">
          <AssignPendingRole userId={user.id} userName={user.name} />
        </div>
      )}
    </article>
  );
}
