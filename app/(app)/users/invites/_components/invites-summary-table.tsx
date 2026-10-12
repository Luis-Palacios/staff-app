"use client";

import type { AdminInviteListItem } from "@/api/auth-api/types";

import { Table } from "@heroui/react";
import { useTranslations } from "next-intl";

import { RoleBadge } from "../../_components/role-badge";

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

export default function InvitesSummaryTable({
  data,
  currentUserId,
}: {
  data: AdminInviteListItem[];
  currentUserId: string;
}) {
  const t = useTranslations("InvitesTable");
  const { root, column, row, cell } = dataTable();

  return (
    <Table
      aria-label={t("tableLabel")}
      className={root()}
      id="invites-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label={t("tableLabel")} className="min-w-[760px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {t("columnInvitee")}
            </Table.Column>
            <Table.Column className={column()}>{t("columnRole")}</Table.Column>
            <Table.Column className={column()}>
              {t("columnStatus")}
            </Table.Column>
            <Table.Column className={column()}>{t("columnSent")}</Table.Column>
            <Table.Column className={column()}>
              <span className="sr-only">{t("columnActions")}</span>
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">{t("empty")}</p>
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
                      secondary={t("invitedBy", { name: inviterLabel(invite) })}
                    />
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <RoleBadge role={invite.role} />
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
