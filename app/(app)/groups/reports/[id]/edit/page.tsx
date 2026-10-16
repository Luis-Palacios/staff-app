import type { Locale } from "@/lib/locale-shared";

import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { EditReportForm } from "../../_components/edit-report-form";
import { listFiledDatesAction } from "../../_actions/report-actions";
import { loadReport } from "../../_lib/load-report";

import { getReportRoster } from "@/api/small-groups-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import { getCurrentSmallGroupAccess } from "@/lib/auth/small-group-access";
import { formatChurchDateTime, getChurchToday } from "@/lib/church-time";
import { formatCalendarShortDate } from "@/lib/format-date";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if ((await getCurrentSmallGroupAccess()) === "none") notFound();

  const [{ id }, t, locale] = await Promise.all([
    params,
    getTranslations("ReportForm"),
    getLocale(),
  ]);
  const report = await loadReport(id);

  // A closed group's reports are read-only (rule 8): back to the report, which says so.
  if (!report.permissions.canEdit) redirect(`/groups/reports/${report.id}`);

  const today = getChurchToday();
  const [roster, filedDates] = await Promise.all([
    getReportRoster(report.smallGroup.id, report.meetingDate),
    listFiledDatesAction(report.smallGroup.id, today),
  ]);

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          groupsBreadcrumb,
          groupsReportsBreadcrumb,
          {
            label: `${report.smallGroup.name}, ${formatCalendarShortDate(report.meetingDate, locale as Locale)}`,
            href: `/groups/reports/${report.id}`,
          },
          { label: t("editTitle"), href: `/groups/reports/${report.id}/edit` },
        ]}
        eyebrow={report.smallGroup.name}
        title={t("editTitle")}
      />
      <EditReportForm
        editMeta={t("editMeta", {
          name: report.submittedBy.name,
          dateTime: formatChurchDateTime(report.submittedAt, locale),
        })}
        filedDates={filedDates}
        initialRoster={roster}
        report={report}
        today={today}
      />
    </>
  );
}
