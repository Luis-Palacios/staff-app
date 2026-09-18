"use client";

import type { AdminInviteListItem } from "@/api/auth-api/types";

import { Table } from "@heroui/react";

import { CancelInviteButton } from "./cancel-invite-button";
import { InviteStatusChip } from "./invite-status-chips";

import { LocalDateTime } from "@/components/local-date-time";
import { ROLE_LABELS } from "@/lib/auth/roles";

export default function InvitesSummaryTable({
  data,
  currentUserId,
}: {
  data: AdminInviteListItem[];
  currentUserId: string;
}) {
  return (
    <Table aria-label="Invites table" id="invites-summary-table">
      <Table.ScrollContainer>
        <Table.Content aria-label="Invites table content">
          <Table.Header>
            <Table.Column isRowHeader className="text-center">
              Email
            </Table.Column>
            <Table.Column className="text-center">Role</Table.Column>
            <Table.Column className="text-center">Status</Table.Column>
            <Table.Column className="text-center">Invited by</Table.Column>
            <Table.Column className="text-center">Sent</Table.Column>
            <Table.Column className="text-center">Actions</Table.Column>
          </Table.Header>
          <Table.Body>
            {data.map((invite) => (
              <Table.Row key={invite.id}>
                <Table.Cell>
                  {invite.emails?.[0] ?? invite.email ?? "—"}
                </Table.Cell>
                <Table.Cell>{ROLE_LABELS[invite.role]}</Table.Cell>
                <Table.Cell>
                  <InviteStatusChip invite={invite} />
                </Table.Cell>
                <Table.Cell>
                  {invite.inviterName ?? invite.inviterEmail ?? "—"}
                </Table.Cell>
                <Table.Cell>
                  <LocalDateTime value={invite.createdAt ?? ""} />
                </Table.Cell>
                <Table.Cell>
                  {invite.status === "pending" &&
                    invite.createdByUserId === currentUserId &&
                    invite.token && <CancelInviteButton token={invite.token} />}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
