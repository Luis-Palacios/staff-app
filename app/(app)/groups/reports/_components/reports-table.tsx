"use client";

import type { ReportListItem } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Table, buttonVariants } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { NoMeetingButton } from "./no-meeting-button";

import { fileReportHref } from "@/app/(app)/groups/reports/_lib/report-links";
import {
  DataTableFooter,
  DataTableOpenLink,
  dataTable,
} from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarMediumDate } from "@/lib/format-date";

export default function ReportsTable({
  items,
  total,
  page,
  pageSize,
  canSubmit,
  onPageChange,
}: {
  items: ReportListItem[];
  total: number;
  page: number;
  pageSize: number;
  canSubmit: boolean;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("ReportsList");
  const locale = useLocale() as Locale;
  const { root, column, row, cell } = dataTable();

  const notFiledBadge = (
    <StatusBadge tone="warning" variant="ring-dot">
      {t("notFiled")}
    </StatusBadge>
  );

  return (
    <Table
      aria-label={t("tableLabel")}
      className={root()}
      id="reports-table"
      variant="secondary"
    >
      <Table.ScrollContainer>
        <Table.Content aria-label={t("tableLabel")} className="min-w-[600px]">
          <Table.Header>
            <Table.Column isRowHeader className={column()}>
              {t("colMeeting")}
            </Table.Column>
            <Table.Column className={column()}>{t("colGroup")}</Table.Column>
            <Table.Column className={column()}>{t("colAttended")}</Table.Column>
            <Table.Column className={column()}>{t("colChurch")}</Table.Column>
            <Table.Column
              className={column({ className: "hidden xl:table-cell" })}
            >
              {t("colBy")}
            </Table.Column>
            <Table.Column className={column()}>
              <span className="sr-only">{t("open")}</span>
            </Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <p className="px-[22px] py-6 text-sm text-muted">
                {t("noMatches")}
              </p>
            )}
          >
            {items.map((item) => {
              const date = formatCalendarMediumDate(item.meetingDate, locale);
              const key = `${item.kind}-${item.smallGroup.id}-${item.meetingDate}`;
              const filed = item.kind === "report";
              const noMeeting = item.kind === "report" && !item.held;

              return (
                <Table.Row
                  key={key}
                  className={row({
                    className: clsx(!filed && "bg-warning-soft/40"),
                  })}
                >
                  <Table.Cell className={cell()}>
                    <span className="flex flex-col">
                      <span className="whitespace-nowrap text-[14.5px] font-semibold text-heading">
                        {date}
                      </span>
                      {/* Below xl the submitter column is hidden and folds under the date. */}
                      <span className="text-[12.5px] text-muted xl:hidden">
                        {item.kind === "report"
                          ? item.held
                            ? t("by", { name: item.submittedBy.name })
                            : t("noMeeting")
                          : notFiledBadge}
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    <span className="flex flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[14.5px]">
                          {item.smallGroup.name}
                        </span>
                        {item.smallGroup.closedAt && (
                          <StatusBadge tone="neutral" variant="ring-dot">
                            {t("closed")}
                          </StatusBadge>
                        )}
                      </span>
                      {item.kind === "report" && item.notHeldReason && (
                        <span
                          className="block max-w-[260px] truncate text-[13px] italic text-muted"
                          title={item.notHeldReason}
                        >
                          {item.notHeldReason}
                        </span>
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    {filed && !noMeeting
                      ? t("countOf", {
                          count: item.attendedGroupCount,
                          total: item.rosterCount,
                        })
                      : "—"}
                  </Table.Cell>
                  <Table.Cell className={cell()}>
                    {filed && !noMeeting
                      ? t("countOf", {
                          count: item.attendedChurchCount,
                          total: item.rosterCount,
                        })
                      : "—"}
                  </Table.Cell>
                  <Table.Cell
                    className={cell({ className: "hidden xl:table-cell" })}
                  >
                    {item.kind !== "report" ? (
                      notFiledBadge
                    ) : item.held ? (
                      item.submittedBy.name
                    ) : (
                      <span className="flex flex-col items-start gap-1">
                        <StatusBadge tone="neutral">
                          {t("noMeeting")}
                        </StatusBadge>
                        <span className="text-[12.5px] text-muted">
                          {t("markedBy", { name: item.submittedBy.name })}
                        </span>
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell className={cell({ className: "text-right" })}>
                    {filed ? (
                      <DataTableOpenLink
                        href={`/groups/reports/${item.id}`}
                        label={t("openLabel", {
                          group: item.smallGroup.name,
                          date,
                        })}
                      />
                    ) : (
                      canSubmit && (
                        <span className="inline-flex items-center justify-end gap-2">
                          <NoMeetingButton
                            ariaLabel={t("noMeetingLabel", {
                              group: item.smallGroup.name,
                              date,
                            })}
                            className="h-[34px] px-3 text-[13px]"
                            label={t("noMeetingAction")}
                            target={{
                              groupId: item.smallGroup.id,
                              groupName: item.smallGroup.name,
                              date: item.meetingDate,
                            }}
                            variant="button"
                          />
                          <NextLink
                            aria-label={t("fileReportLabel", {
                              group: item.smallGroup.name,
                              date,
                            })}
                            className={buttonVariants({
                              size: "sm",
                              variant: "primary",
                              className:
                                "h-[34px] gap-1.5 px-3 text-[13px] font-semibold md:h-[34px]",
                            })}
                            href={fileReportHref(
                              item.smallGroup.id,
                              item.meetingDate,
                            )}
                          >
                            <PlusIcon
                              aria-hidden="true"
                              className="size-3.5"
                              strokeWidth={2}
                            />
                            {t("fileReport")}
                          </NextLink>
                        </span>
                      )
                    )}
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
