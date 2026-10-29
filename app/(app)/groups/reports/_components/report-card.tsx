"use client";

import type { ReportListItem } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { NoMeetingButton } from "./no-meeting-button";

import { fileReportHref } from "@/app/(app)/groups/reports/_lib/report-links";
import { GuestsBadge } from "@/components/guests-badge";
import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarMediumDate } from "@/lib/format-date";

// Phone stand-in for a table row: date, group and status, then the two counts and "Open" for a
// filed report, or the not-filed note and "File report".
export default function ReportCard({
  item,
  canSubmit,
  leader,
}: {
  item: ReportListItem;
  canSubmit: boolean;
  /** The group's current leader; undefined when it has none. */
  leader: string | undefined;
}) {
  const t = useTranslations("ReportsList");
  const tWeek = useTranslations("NoMeetingWeek");
  const locale = useLocale() as Locale;
  const date = formatCalendarMediumDate(item.meetingDate, locale);

  const openLink =
    item.kind === "report" ? (
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
    ) : null;

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
            {item.smallGroup.audience === "guests" && <GuestsBadge />}
            {item.smallGroup.closedAt && (
              <StatusBadge tone="neutral" variant="ring-dot">
                {t("closed")}
              </StatusBadge>
            )}
          </p>
          {!item.smallGroup.closedAt && (
            <p className="text-[13px] text-muted">{leader ?? t("noLeader")}</p>
          )}
        </div>
        {item.kind === "report" ? (
          item.held ? (
            <StatusBadge tone="success">{t("filed")}</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">
              {item.noMeetingWeekId !== null ? tWeek("label") : t("noMeeting")}
            </StatusBadge>
          )
        ) : (
          <StatusBadge tone="warning" variant="ring-dot">
            {t("notFiled")}
          </StatusBadge>
        )}
      </div>
      {item.kind === "report" && !item.held ? (
        <>
          {item.notHeldReason && (
            <p className="text-[13.5px] italic text-muted">
              {item.notHeldReason}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted">
              {t("markedBy", { name: item.submittedBy.name })}
            </span>
            {openLink}
          </div>
        </>
      ) : item.kind === "report" ? (
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
            {openLink}
          </div>
        </>
      ) : (
        <>
          <p className="text-[13.5px] text-warning-soft-foreground">
            {t("missingNote")}
          </p>
          {canSubmit && (
            <div className="grid grid-cols-2 gap-2">
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
              <NoMeetingButton
                ariaLabel={t("noMeetingLabel", {
                  group: item.smallGroup.name,
                  date,
                })}
                className="h-[38px] w-full px-3 text-[13px]"
                label={t("noMeetingAction")}
                target={{
                  groupId: item.smallGroup.id,
                  groupName: item.smallGroup.name,
                  date: item.meetingDate,
                }}
                variant="button"
              />
            </div>
          )}
        </>
      )}
    </article>
  );
}
