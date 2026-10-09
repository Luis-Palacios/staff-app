import type {
  AdminInviteListItem,
  AdminUserListItem,
} from "@/api/auth-api/types";
import type { Settled } from "@/lib/settle";

import { ChevronRightIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@heroui/react/skeleton";
import NextLink from "next/link";

import { AssignPendingRole } from "../users/_components/assign-pending-role";

import { iconTile } from "./stat-tile";

import { card, title } from "@/components/primitives";

const cardClasses = card({ className: "flex flex-col gap-3.5 px-[22px] py-5" });

const errorLine = "text-sm text-danger";

// Admin/elder only. Users waiting for a role (assignable right here) and a
// link to invites nobody has accepted yet. Renders nothing when both are
// empty, so the side column doesn't carry an empty card. A half that failed
// to load shows a one-line error and the other half still renders.
export async function NeedsAttentionCard({
  pendingUsers: pendingUsersPromise,
  openInvites: openInvitesPromise,
}: {
  pendingUsers: Promise<Settled<AdminUserListItem[]>>;
  openInvites: Promise<Settled<AdminInviteListItem[]>>;
}) {
  const [pendingUsers, openInvites] = await Promise.all([
    pendingUsersPromise,
    openInvitesPromise,
  ]);

  const showUsers = !pendingUsers.ok || pendingUsers.value.length > 0;
  const showInvites = !openInvites.ok || openInvites.value.length > 0;

  if (!showUsers && !showInvites) {
    return null;
  }

  return (
    <section className={cardClasses}>
      <h2 className={title({ size: "sm" })}>Needs your attention</h2>

      {showUsers && (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[13px] font-semibold text-muted">
            Waiting for a role
          </h3>
          {pendingUsers.ok ? (
            <ul className="flex flex-col gap-3">
              {pendingUsers.value.map((user) => (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[14.5px] font-semibold text-heading">
                      {user.name}
                    </span>
                    <span className="truncate text-[13px] text-muted">
                      {user.email}
                    </span>
                  </span>
                  <AssignPendingRole userId={user.id} userName={user.name} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={errorLine}>Couldn&apos;t load users.</p>
          )}
        </div>
      )}

      {showUsers && showInvites && <hr className="border-separator" />}

      {showInvites && !openInvites.ok && (
        <p className={errorLine}>Couldn&apos;t load invites.</p>
      )}

      {openInvites.ok && openInvites.value.length > 0 && (
        <NextLink
          className="flex items-center gap-3 rounded-control text-sm"
          href="/users/invites"
        >
          <span className={iconTile({ tone: "warning" })}>
            <EnvelopeIcon
              aria-hidden="true"
              className="size-[18px]"
              strokeWidth={1.7}
            />
          </span>
          <span className="flex-1">
            <strong className="font-semibold text-heading">
              {openInvites.value.length}{" "}
              {openInvites.value.length === 1 ? "invite" : "invites"}
            </strong>{" "}
            {openInvites.value.length === 1 ? "hasn't" : "haven't"} been
            accepted yet
          </span>
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-subtle"
            strokeWidth={2}
          />
        </NextLink>
      )}
    </section>
  );
}

export function NeedsAttentionCardSkeleton() {
  return (
    <div className={cardClasses}>
      <Skeleton className="h-6 w-52 rounded" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3.5 w-44 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-control" />
      </div>
      <Skeleton className="h-9 w-full rounded-control" />
    </div>
  );
}
