"use client";

import type { MemberSummary } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import { Table } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { AccountStatusCell } from "./account-status-cell";
import { InactiveBadge } from "./inactive-badge";
import { InactiveReasonChip } from "./inactive-reason-chip";

import {
  DataTableFooter,
  DataTableOpenLink,
  DataTablePrimaryCell,
  dataTable,
} from "@/components/data-table";
import { formatCalendarDate } from "@/lib/format-date";

export default function MembersSummaryTable({
  data,
  accounts,
  signInOff,
  tab,
  emptyLine,
}: {
  data: MemberSummary[];
  /** Absent for roles that can't see links, and on the Inactive tab (no Account column). */
  accounts?: Record<number, AccountStatus>;
  /** Ids of inactive members whose user is banned. */
  signInOff?: ReadonlySet<number>;
  tab: "active" | "inactive" | "all";
  /** What an empty tab or search says. */
  emptyLine: string;
}) {
  const t = useTranslations("MembersBrowser");
  const locale = useLocale();
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
          className={
            accounts || tab === "inactive" ? "min-w-[720px]" : "min-w-[760px]"
          }
        >
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {t("columnMember")}
            </Table.Column>
            {tab === "inactive" && (
              <Table.Column className={column()}>
                {t("columnLeft")}
              </Table.Column>
            )}
            {accounts && (
              <Table.Column className={column()}>
                {t("columnAccount")}
              </Table.Column>
            )}
            <Table.Column className={column()}>{t("columnEmail")}</Table.Column>
            <Table.Column className={column()}>{t("columnPhone")}</Table.Column>
            <Table.Column className={column()}>
              <span className="sr-only">{t("columnActions")}</span>
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">{emptyLine}</p>
            )}
          >
            {data.map((member) => {
              const href = `/members/${member.id}`;
              const inactive = member.status === "inactive";
              const left = member.inactiveSince
                ? formatCalendarDate(member.inactiveSince, locale)
                : null;

              return (
                <Table.Row key={member.id} className={row()}>
                  <Table.Cell className={cell()}>
                    <DataTablePrimaryCell
                      badge={tab === "all" && inactive && <InactiveBadge />}
                      href={href}
                      mutedAvatar={inactive}
                      name={member.name}
                      secondary={
                        tab === "all" && left
                          ? t("memberNumberLeft", {
                              id: String(member.id),
                              date: left,
                            })
                          : t("memberNumber", { id: String(member.id) })
                      }
                    />
                  </Table.Cell>
                  {tab === "inactive" && (
                    <Table.Cell className={cell()}>
                      <span className="flex flex-col items-start gap-1">
                        <span className="whitespace-nowrap">
                          {left ?? notProvided}
                        </span>
                        <InactiveReasonChip reason={member.inactiveReason} />
                      </span>
                    </Table.Cell>
                  )}
                  {accounts && (
                    <Table.Cell className={cell()}>
                      <AccountStatusCell
                        signInOff={signInOff?.has(member.id)}
                        status={accounts[member.id] ?? "none"}
                      />
                    </Table.Cell>
                  )}
                  <Table.Cell className={cell()}>
                    {member.email ?? notProvided}
                  </Table.Cell>
                  <Table.Cell
                    className={cell({ className: "whitespace-nowrap" })}
                  >
                    {member.phone ?? notProvided}
                  </Table.Cell>
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
