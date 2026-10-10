"use client";

import type { AdminInviteListItem } from "@/api/auth-api/types";

import { Table } from "@heroui/react";

import { roleBadgeProps, roleLabel } from "../../_components/role-display";

import { CancelInviteButton } from "./cancel-invite-button";
import { cancelToken, inviteEmail, inviterLabel } from "./invite-display";
import { InviteStatusChip } from "./invite-status-chips";

import {
  DataTableFooter,
  DataTablePrimaryCell,
  dataTable,
} from "@/components/data-table";
import { LocalDate } from "@/components/local-date";
import { LocalTime } from "@/components/local-time";
import { StatusBadge } from "@/components/status-badge";

export default function InvitesSummaryTable({
  data,
  currentUserId,
}: {
  data: AdminInviteListItem[];
  currentUserId: string;
}) {
  const { root, column, row, cell } = dataTable();

  return (
    <Table
      aria-label="Invites"
      className={root()}
      id="invites-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label="Invites" className="min-w-[760px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              Invitee
            </Table.Column>
            <Table.Column className={column()}>Role</Table.Column>
            <Table.Column className={column()}>Status</Table.Column>
            <Table.Column className={column()}>Sent</Table.Column>
            <Table.Column className={column()}>
              <span className="sr-only">Actions</span>
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">
                No invites sent yet.
              </p>
            )}
          >
            {data.map((invite) => {
              const email = inviteEmail(invite);
              const token = cancelToken(invite, currentUserId);

              return (
                <Table.Row key={invite.id} className={row()}>
                  <Table.Cell className={cell()}>
                    <DataTablePrimaryCell
                      name={email}
                      secondary={`Invited by ${inviterLabel(invite)}`}
                    />
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <StatusBadge {...roleBadgeProps(invite.role)}>
                      {roleLabel(invite.role)}
                    </StatusBadge>
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <InviteStatusChip invite={invite} />
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <span className="flex flex-col">
                      <span className="text-heading">
                        <LocalDate value={invite.createdAt ?? ""} />
                      </span>
                      <span className="text-[12.5px] text-muted">
                        <LocalTime value={invite.createdAt ?? ""} />
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell className={cell({ className: "text-right" })}>
                    {token && (
                      <CancelInviteButton email={email} token={token} />
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <DataTableFooter total={data.length} />
    </Table>
  );
}
