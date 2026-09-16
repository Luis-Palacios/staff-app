"use client";

import type { AdminUserListItem } from "@/api/auth-api/types";

import { Chip, Table } from "@heroui/react";

import { AssignPendingRole } from "./assign-pending-role";
import { roleChipColor, roleLabel } from "./role-display";
import { UserStatusChips } from "./user-status-chips";

import { LocalDateTime } from "@/components/local-date-time";

export default function UsersSummaryTable({
  data,
}: {
  data: AdminUserListItem[];
}) {
  return (
    <Table aria-label="Users table" id="users-summary-table">
      <Table.ScrollContainer>
        <Table.Content aria-label="Users table content">
          <Table.Header>
            <Table.Column isRowHeader className="text-center">
              Name
            </Table.Column>
            <Table.Column className="text-center">Email</Table.Column>
            <Table.Column className="text-center">Role</Table.Column>
            <Table.Column className="text-center">Status</Table.Column>
            <Table.Column className="text-center">Created</Table.Column>
          </Table.Header>
          <Table.Body>
            {data.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>{user.name}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>
                  {user.role === "pending" ? (
                    <AssignPendingRole userId={user.id} userName={user.name} />
                  ) : (
                    <Chip color={roleChipColor(user.role)}>
                      {roleLabel(user.role)}
                    </Chip>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-wrap justify-center gap-1">
                    <UserStatusChips user={user} />
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <LocalDateTime value={user.createdAt} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
