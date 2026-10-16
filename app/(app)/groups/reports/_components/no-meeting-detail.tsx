import type { ReportDetail } from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  InformationCircleIcon,
  LockClosedIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { DeleteReportDialog } from "./delete-report-dialog";
import { NoMeetingButton } from "./no-meeting-button";

import { getMe } from "@/api/members-api/client";
import { fileReportHref } from "@/app/(app)/groups/reports/_lib/report-links";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { StatusBadge } from "@/components/status-badge";
import { card, testimony, title } from "@/components/primitives";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import { getPermissions } from "@/lib/auth/get-permissions";
import { reportAccess } from "@/lib/auth/permissions";
import { formatChurchDateTime } from "@/lib/church-time";
import {
  formatCalendarDate,
  formatCalendarFullDate,
  formatCalendarShortDate,
} from "@/lib/format-date";

// The detail page of a date marked as no meeting (`held === false`): the reason, the actions and,
// for someone who can file, the way to replace the mark with a report.
export async function NoMeetingDetail({ report }: { report: ReportDetail }) {
  const [t, locale, me, permissions] = await Promise.all([
    getTranslations("ReportDetail"),
    getLocale(),
    getMe(),
    getPermissions(),
  ]);
  const { smallGroup, meetingDate } = report;
  const canFile =
    reportAccess(permissions, me).canSubmit && smallGroup.closedAt === null;
  const typedLocale = locale as Locale;
  const longDate = formatCalendarDate(meetingDate, typedLocale);
  const groupHref = `/groups/${smallGroup.id}`;
  const buttonClass =
    "h-[42px] flex-1 gap-2 px-[18px] font-semibold sm:flex-none md:h-[42px]";

  return (
    <>
      <StaffAppPageHeader
        actions={
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <NextLink
              className={buttonVariants({
                variant: "outline",
                className: buttonClass,
              })}
              href={groupHref}
            >
              <UserGroupIcon
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.8}
              />
              {t("groupPage")}
            </NextLink>
            {report.permissions.canDelete && (
              <DeleteReportDialog
                groupId={smallGroup.id}
                labels={{
                  trigger: t("delete"),
                  title: t("deleteNoMeetingTitle"),
                  body: t("deleteNoMeetingBody", { date: longDate }),
                  confirm: t("delete"),
                }}
                reportId={report.id}
              />
            )}
            {report.permissions.canEdit && (
              <NoMeetingButton
                className={buttonClass}
                emphasis="primary"
                kind="edit"
                label={t("editReason")}
                target={{
                  groupId: smallGroup.id,
                  groupName: smallGroup.name,
                  date: meetingDate,
                  reportId: report.id,
                  reason: report.notHeldReason,
                }}
                variant="button"
              />
            )}
          </div>
        }
        breadcrumbs={[
          groupsBreadcrumb,
          groupsReportsBreadcrumb,
          {
            label: `${smallGroup.name}, ${formatCalendarShortDate(meetingDate, typedLocale)}`,
            href: `/groups/reports/${report.id}`,
          },
        ]}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StatusBadge tone="neutral">{t("noMeeting")}</StatusBadge>
            {t("markedOn", {
              name: report.submittedBy.name,
              dateTime: formatChurchDateTime(report.submittedAt, locale),
            })}
          </span>
        }
        eyebrow={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <NextLink className="hover:underline" href={groupHref}>
              {smallGroup.name}
            </NextLink>
            {smallGroup.closedAt && (
              <StatusBadge tone="neutral" variant="ring-dot">
                {t("groupClosed")}
              </StatusBadge>
            )}
          </span>
        }
        title={formatCalendarFullDate(meetingDate, typedLocale)}
      />

      {smallGroup.closedAt && (
        <div className="mb-5 flex items-start gap-3 rounded-tile border border-border bg-surface-secondary px-4 py-3.5">
          <LockClosedIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-muted"
            strokeWidth={1.6}
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-heading">
              {t("readOnlyTitle")}
            </p>
            <p className="text-sm text-muted">
              {t("readOnlyBody", {
                group: smallGroup.name,
                date: formatCalendarDate(smallGroup.closedAt, typedLocale),
              })}
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className={card({ className: "flex flex-col gap-4 p-6" })}>
          <header className="flex flex-col gap-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-eyebrow">
              {t("reasonEyebrow")}
            </p>
            <h2 className={title({ size: "sm", className: "text-[22px]" })}>
              {t("didntMeet")}
            </h2>
          </header>
          {report.notHeldReason ? (
            <p className={testimony({ className: "whitespace-pre-line" })}>
              {report.notHeldReason}
            </p>
          ) : (
            <p className="text-sm text-muted">{t("noReason")}</p>
          )}
          <p className="flex items-start gap-2 text-[13px] text-muted">
            <InformationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {t("noMeetingEffect")}
          </p>
        </section>

        {canFile && (
          <aside className="flex flex-col gap-3 rounded-card border border-dashed border-field-border p-5">
            <h2 className="font-display text-xl text-heading">
              {t("metAfterAllTitle")}
            </h2>
            <p className="text-sm text-muted">{t("metAfterAllBody")}</p>
            <NextLink
              className={buttonVariants({
                variant: "primary",
                className:
                  "h-[42px] w-full gap-2 px-[18px] font-semibold md:h-[42px]",
              })}
              href={fileReportHref(smallGroup.id, meetingDate)}
            >
              <PlusIcon
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={2}
              />
              {t("fileInstead", {
                date: formatCalendarShortDate(meetingDate, typedLocale),
              })}
            </NextLink>
          </aside>
        )}
      </div>
    </>
  );
}
