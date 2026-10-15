"use client";

import type { AdminUserListItem } from "@/api/auth-api/types";
import type { LinkedMembers } from "./users-browser";

import { Table } from "@heroui/react";
import { useTranslations } from "next-intl";

import { AssignPendingRole } from "./assign-pending-role";
import { RoleBadge } from "./role-badge";
import { UserMemberLink } from "./user-member-link";
import { UserStatusChips } from "./user-status-chips";

import {
  DataTableFooter,
  DataTablePrimaryCell,
  dataTable,
} from "@/components/data-table";
import { LocalDate } from "@/components/local-date";
import { LocalTime } from "@/components/local-time";

export default function UsersSummaryTable({
  data,
  members,
  emptyLabel,
}: {
  data: AdminUserListItem[];
  emptyLabel: string;
  members: LinkedMembers;
}) {
  const t = useTranslations("UsersTable");
  const { root, column, row, cell } = dataTable();

  return (
    <Table
      aria-label={t("tableLabel")}
      className={root()}
      id="users-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label={t("tableLabel")} className="min-w-[880px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {t("columnPerson")}
            </Table.Column>
            <Table.Column className={column()}>{t("columnRole")}</Table.Column>
            <Table.Column className={column()}>
              {t("columnMember")}
            </Table.Column>
            <Table.Column className={column()}>
              {t("columnStatus")}
            </Table.Column>
            <Table.Column className={column()}>
              {t("columnJoined")}
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">{emptyLabel}</p>
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
                    <RoleBadge role={user.role} />
                  )}
                </Table.Cell>
                <Table.Cell className={cell()}>
                  <UserMemberLink member={members[user.id]} />
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
