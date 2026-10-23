"use client";

import type { GuestListItem } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import { Table } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { GuestGroupCell } from "./guest-group-cell";
import { GuestLastSeen } from "./guest-last-seen";

import {
  DataTableFooter,
  DataTableOpenLink,
  DataTablePrimaryCell,
  dataTable,
} from "@/components/data-table";
import { formatCalendarDate } from "@/lib/format-date";

export default function GuestsSummaryTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
}: {
  data: GuestListItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("GuestsBrowser");
  const locale = useLocale() as Locale;
  const { root, column, row, cell } = dataTable();

  const notProvided = <span className="text-subtle">{t("notProvided")}</span>;

  return (
    <Table
      aria-label={t("tableLabel")}
      className={root()}
      id="guests-summary-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label={t("tableLabel")} className="min-w-[860px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {t("columnGuest")}
            </Table.Column>
            <Table.Column className={column()}>{t("columnPhone")}</Table.Column>
            <Table.Column className={column()}>{t("columnGroup")}</Table.Column>
            <Table.Column className={column()}>
              {t("columnLastSeen")}
            </Table.Column>
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
            {data.map((guest) => {
              const href = `/guests/${guest.id}`;

              return (
                <Table.Row key={guest.id} className={row()}>
                  <Table.Cell className={cell()}>
                    <DataTablePrimaryCell
                      href={href}
                      name={guest.name}
                      secondary={
                        guest.firstVisitDate
                          ? t("firstVisit", {
                              date: formatCalendarDate(
                                guest.firstVisitDate,
                                locale,
                              ),
                            })
                          : undefined
                      }
                    />
                  </Table.Cell>
                  <Table.Cell
                    className={cell({ className: "whitespace-nowrap" })}
                  >
                    {guest.phone ?? notProvided}
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <GuestGroupCell guest={guest} />
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <GuestLastSeen guest={guest} />
                  </Table.Cell>
                  <Table.Cell className={cell({ className: "text-right" })}>
                    <DataTableOpenLink
                      href={href}
                      label={t("openGuest", { name: guest.name })}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <DataTableFooter
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </Table>
  );
}
