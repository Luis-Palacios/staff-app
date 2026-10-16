import type { Locale } from "@/lib/locale-shared";

import { notFound } from "next/navigation";
import {
  LockClosedIcon,
  PencilSquareIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { DeleteReportDialog } from "../_components/delete-report-dialog";
import { ReportAttendanceCard } from "../_components/report-attendance-card";
import { ReportSharedCard } from "../_components/report-shared-card";
import { ReportSummaryTiles } from "../_components/report-summary-tiles";
import { loadReport } from "../_lib/load-report";

import { getSmallGroup } from "@/api/small-groups-api/client";
import { SavedToast } from "@/components/saved-toast";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import { getCurrentSmallGroupAccess } from "@/lib/auth/small-group-access";
import { formatChurchDateTime } from "@/lib/church-time";
import {
  formatCalendarDate,
  formatCalendarFullDate,
  formatCalendarShortDate,
} from "@/lib/format-date";

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const access = await getCurrentSmallGroupAccess();

  if (access === "none") notFound();

  const [{ id }, { saved }, t, locale] = await Promise.all([
    params,
    searchParams,
    getTranslations("ReportDetail"),
    getLocale(),
  ]);
  const report = await loadReport(id);
  const { smallGroup, meetingDate, permissions } = report;
  // Start dates of the people still in the group, for "In the group since" (the report has none).
  // A closed group has no active members, and a failed read just drops the hint.
  const joinedByMember: Record<number, string> = {};

  if (!smallGroup.closedAt) {
    try {
      const group = await getSmallGroup(String(smallGroup.id));

      for (const member of group.members) {
        joinedByMember[member.memberId] = member.joinedAt;
      }
    } catch {
      // The hint is optional.
    }
  }

  const typedLocale = locale as Locale;
  const shortDate = formatCalendarShortDate(meetingDate, typedLocale);
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
            {permissions.canDelete && (
              <DeleteReportDialog
                groupId={smallGroup.id}
                labels={{
                  trigger: t("delete"),
                  title: t("deleteTitle"),
                  body: t("deleteBody", {
                    group: smallGroup.name,
                    date: formatCalendarDate(meetingDate, typedLocale),
                  }),
                  confirm: t("deleteConfirm"),
                }}
                reportId={report.id}
              />
            )}
            {permissions.canEdit && (
              <NextLink
                className={buttonVariants({
                  variant: "primary",
                  className: buttonClass,
                })}
                href={`/groups/reports/${report.id}/edit`}
              >
                <PencilSquareIcon
                  aria-hidden="true"
                  className="size-[18px]"
                  strokeWidth={1.8}
                />
                {t("edit")}
              </NextLink>
            )}
          </div>
        }
        breadcrumbs={[
          groupsBreadcrumb,
          groupsReportsBreadcrumb,
          {
            label: `${smallGroup.name}, ${shortDate}`,
            href: `/groups/reports/${report.id}`,
          },
        ]}
        description={t("submittedBy", {
          name: report.submittedBy.name,
          dateTime: formatChurchDateTime(report.submittedAt, locale),
        })}
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

      <ReportSummaryTiles report={report} />
      <ReportSharedCard report={report} />
      <ReportAttendanceCard
        joinedByMember={joinedByMember}
        linkMembers={access === "full"}
        report={report}
      />

      {(saved === "submitted" || saved === "updated") && (
        <SavedToast message={t(saved)} />
      )}
    </>
  );
}
