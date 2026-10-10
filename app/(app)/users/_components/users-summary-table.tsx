"use client";

import type { AdminUserListItem } from "@/api/auth-api/types";

import { Table } from "@heroui/react";

import { AssignPendingRole } from "./assign-pending-role";
import { roleBadgeProps, roleLabel } from "./role-display";
import { UserStatusChips } from "./user-status-chips";

import {
  DataTableFooter,
  DataTablePrimaryCell,
  dataTable,
} from "@/components/data-table";
import { LocalDate } from "@/components/local-date";
import { LocalTime } from "@/components/local-time";
import { StatusBadge } from "@/components/status-badge";

export default function UsersSummaryTable({
  data,
}: {
  data: AdminUserListItem[];
}) {
  const { root, column, row, cell } = dataTable();

  return (
    <Table
      aria-label="Users"
      className={root()}
      id="users-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label="Users" className="min-w-[760px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              Person
            </Table.Column>
            <Table.Column className={column()}>Role</Table.Column>
            <Table.Column className={column()}>Status</Table.Column>
            <Table.Column className={column()}>Joined</Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">No users yet.</p>
            )}
          >
            {data.map((user) => (
              <Table.Row key={user.id} className={row()}>
                <Table.Cell className={cell()}>
                  <DataTablePrimaryCell
                    name={user.name}
                    secondary={user.email}
                  />
                </Table.Cell>
                <Table.Cell className={cell()}>
                  {user.role === "pending" ? (
                    <AssignPendingRole userId={user.id} userName={user.name} />
                  ) : (
                    <StatusBadge {...roleBadgeProps(user.role)}>
                      {roleLabel(user.role)}
                    </StatusBadge>
                  )}
                </Table.Cell>
                <Table.Cell className={cell()}>
                  <span className="flex flex-wrap gap-1.5">
                    <UserStatusChips user={user} />
                  </span>
                </Table.Cell>
                <Table.Cell className={cell()}>
                  <span className="flex flex-col">
                    <span className="text-heading">
                      <LocalDate value={user.createdAt} />
                    </span>
                    <span className="text-[12.5px] text-muted">
                      <LocalTime value={user.createdAt} />
                    </span>
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <DataTableFooter total={data.length} />
    </Table>
  );
}
