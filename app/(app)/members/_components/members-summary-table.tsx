"use client";

import type { MemberSummary } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import { Table } from "@heroui/react";
import { useTranslations } from "next-intl";

import { AccountStatusCell } from "./account-status-cell";

import {
  DataTableFooter,
  DataTableOpenLink,
  DataTablePrimaryCell,
  dataTable,
} from "@/components/data-table";

export default function MembersSummaryTable({
  data,
  accounts,
}: {
  data: MemberSummary[];
  accounts?: Record<number, AccountStatus>;
}) {
  const t = useTranslations("MembersBrowser");
  const { root, column, row, cell } = dataTable();

  const notProvided = <span className="text-subtle">{t("notProvided")}</span>;

  return (
    <Table
      aria-label={t("tableLabel")}
      className={root()}
      id="members-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content
          aria-label={t("tableLabel")}
          className={accounts ? "min-w-[880px]" : "min-w-[760px]"}
        >
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {t("columnMember")}
            </Table.Column>
            <Table.Column className={column()}>{t("columnEmail")}</Table.Column>
            <Table.Column className={column()}>{t("columnPhone")}</Table.Column>
            {accounts && (
              <Table.Column className={column()}>
                {t("columnAccount")}
              </Table.Column>
            )}
            <Table.Column className={column()}>
              <span className="sr-only">{t("columnActions")}</span>
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">
                {t("noMatches")}
              </p>
            )}
          >
            {data.map((member) => {
              const href = `/members/${member.id}`;

              return (
                <Table.Row key={member.id} className={row()}>
                  <Table.Cell className={cell()}>
                    <DataTablePrimaryCell
                      href={href}
                      name={member.name}
                      secondary={t("memberNumber", { id: String(member.id) })}
                    />
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    {member.email ?? notProvided}
                  </Table.Cell>
                  <Table.Cell
                    className={cell({ className: "whitespace-nowrap" })}
                  >
                    {member.phone ?? notProvided}
                  </Table.Cell>
                  {accounts && (
                    <Table.Cell className={cell()}>
                      <AccountStatusCell
                        status={accounts[member.id] ?? "none"}
                      />
                    </Table.Cell>
                  )}
                  <Table.Cell className={cell({ className: "text-right" })}>
                    <DataTableOpenLink
                      href={href}
                      label={t("openMember", { name: member.name })}
                    />
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
