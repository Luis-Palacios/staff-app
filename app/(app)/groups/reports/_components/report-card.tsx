"use client";

import type { ReportListItem } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { fileReportHref } from "./reports-table";

import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarMediumDate } from "@/lib/format-date";

// Phone stand-in for a table row: date, group and status, then the two counts and "Open" for a
// filed report, or the not-filed note and "File report".
export default function ReportCard({
  item,
  canSubmit,
}: {
  item: ReportListItem;
  canSubmit: boolean;
}) {
  const t = useTranslations("ReportsList");
  const locale = useLocale() as Locale;
  const date = formatCalendarMediumDate(item.meetingDate, locale);

  return (
    <article
      className={card({
        className: clsx(
          "flex flex-col gap-3 p-4",
          item.kind === "notFiled" && "bg-warning-soft/40",
        ),
      })}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-[15px] font-semibold text-heading">{date}</h3>
          <p className="flex flex-wrap items-center gap-x-2 text-[13.5px] text-muted">
            {item.smallGroup.name}
            {item.smallGroup.closedAt && (
              <StatusBadge tone="neutral" variant="ring-dot">
                {t("closed")}
              </StatusBadge>
            )}
          </p>
        </div>
        {item.kind === "report" ? (
          <StatusBadge tone="success">{t("filed")}</StatusBadge>
        ) : (
          <StatusBadge tone="warning" variant="ring-dot">
            {t("notFiled")}
          </StatusBadge>
        )}
      </div>
      {item.kind === "report" ? (
        <>
          <p className="text-[13.5px] text-foreground">
            {t("countOf", {
              count: item.attendedGroupCount,
              total: item.rosterCount,
            })}{" "}
            <span className="text-muted">{t("atMeeting")}</span>
            {" · "}
            {t("countOf", {
              count: item.attendedChurchCount,
              total: item.rosterCount,
            })}{" "}
            <span className="text-muted">{t("atChurch")}</span>
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted">
              {t("by", { name: item.submittedBy.name })}
            </span>
            <NextLink
              aria-label={t("openLabel", {
                group: item.smallGroup.name,
                date,
              })}
              className={buttonVariants({
                size: "sm",
                variant: "outline",
                className: "h-[34px] gap-1.5 px-3 text-[13px] font-semibold",
              })}
              href={`/groups/reports/${item.id}`}
            >
              {t("open")}
              <ChevronRightIcon
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
            </NextLink>
          </div>
        </>
      ) : (
        <>
          <p className="text-[13.5px] text-warning-soft-foreground">
            {t("missingNote")}
          </p>
          {canSubmit && (
            <NextLink
              aria-label={t("fileReportLabel", {
                group: item.smallGroup.name,
                date,
              })}
              className={buttonVariants({
                variant: "primary",
                className:
                  "h-[38px] w-full gap-1.5 px-3 text-[13px] font-semibold",
              })}
              href={fileReportHref(item.smallGroup.id, item.meetingDate)}
            >
              <PlusIcon
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={2}
              />
              {t("fileReport")}
            </NextLink>
          )}
        </>
      )}
    </article>
  );
}
