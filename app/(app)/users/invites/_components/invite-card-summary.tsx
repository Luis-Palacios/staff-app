import type { AdminInviteListItem } from "@/api/auth-api/types";

import { roleBadgeProps, roleLabel } from "../../_components/role-display";

import { CancelInviteButton } from "./cancel-invite-button";
import { cancelToken, inviteEmail, inviterLabel } from "./invite-display";
import { InviteStatusChip } from "./invite-status-chips";

import { InitialsAvatar } from "@/components/initials-avatar";
import { LocalDate } from "@/components/local-date";
import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";

// Mobile stand-in for a table row: avatar, email and status, then the role,
// sender and date, and Cancel when the viewer sent a still-pending invite.
export default function InviteCardSummary({
  invite,
  currentUserId,
}: {
  invite: AdminInviteListItem;
  currentUserId: string;
}) {
  const email = inviteEmail(invite);
  const token = cancelToken(invite, currentUserId);

  return (
    <article className={card({ className: "flex flex-col gap-2.5 p-4" })}>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={email} />
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-heading">
          {email}
        </h2>
        <InviteStatusChip invite={invite} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-12 text-[13px] text-muted">
        <StatusBadge {...roleBadgeProps(invite.role)}>
          {roleLabel(invite.role)}
        </StatusBadge>
        <span>
          Sent <LocalDate value={invite.createdAt ?? ""} /> by{" "}
          {inviterLabel(invite)}
        </span>
      </div>
      {token && (
        <div className="flex justify-end">
          <CancelInviteButton email={email} token={token} />
        </div>
      )}
    </article>
  );
}
