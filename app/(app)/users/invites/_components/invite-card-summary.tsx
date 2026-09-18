import type { AdminInviteListItem } from "@/api/auth-api/types";

import { Card } from "@heroui/react/card";

import { CancelInviteButton } from "./cancel-invite-button";
import { InviteStatusChip } from "./invite-status-chips";

import { LocalDateTime } from "@/components/local-date-time";
import { ROLE_LABELS } from "@/lib/auth/roles";

export default function InviteCardSummary({
  invite,
  currentUserId,
}: {
  invite: AdminInviteListItem;
  currentUserId: string;
}) {
  return (
    <Card.Root key={invite.id}>
      <Card.Header>
        <Card.Title>{invite.emails?.[0] ?? invite.email ?? "—"}</Card.Title>
        <Card.Description>{ROLE_LABELS[invite.role]}</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1 text-sm">
        <div>
          Sent: <LocalDateTime value={invite.createdAt ?? ""} />
        </div>
        <div>
          Invited by: {invite.inviterName ?? invite.inviterEmail ?? "—"}
        </div>
      </Card.Content>
      <Card.Footer className="flex flex-wrap items-center gap-1">
        <InviteStatusChip invite={invite} />
        {invite.status === "pending" &&
          invite.createdByUserId === currentUserId &&
          invite.token && <CancelInviteButton token={invite.token} />}
      </Card.Footer>
    </Card.Root>
  );
}
