import type { ReportDetail } from "@/api/small-groups-api/types";

import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ReportFlow } from "../../_components/report-flow";
import { listReportedDatesAction } from "../../_actions/report-actions";
import { loadReport } from "../../_lib/load-report";

import { getMe } from "@/api/members-api/client";
import { getReportRoster } from "@/api/small-groups-api/client";
import { getPermissions } from "@/lib/auth/get-permissions";
import { reportAccess } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/get-permissions";
import {
  churchDateOf,
  formatChurchDateTime,
  formatChurchTime,
  getChurchToday,
} from "@/lib/church-time";

/**
 * "Submitted by X on … · Last edited by Y today at …" (`Edit-Live`), in the church's time zone.
 * Null for a draft, which says who started it on its resume card instead.
 */
async function liveMeta(
  report: ReportDetail,
  today: string,
): Promise<string | null> {
  if (!report.submittedBy || !report.submittedAt) return null;

  const [t, locale] = await Promise.all([
    getTranslations("ReportForm"),
    getLocale(),
  ]);
  const submitted = {
    name: report.submittedBy.name,
    dateTime: formatChurchDateTime(report.submittedAt, locale),
  };

  if (!report.lastEditedAt) return t("submittedMeta", submitted);

  const when =
    churchDateOf(report.lastEditedAt) === today
      ? t("whenToday", { time: formatChurchTime(report.lastEditedAt, locale) })
      : t("whenOn", {
          dateTime: formatChurchDateTime(report.lastEditedAt, locale),
        });
  const lastEdited = report.lastEditedBy
    ? t("lastEdited", { name: report.lastEditedBy.name, when })
    : t("lastEditedNoName", { when });

  return t("liveMeta", { ...submitted, lastEdited });
}

/**
 * The one report editor (auto-save stage 3): a draft (the caller's group's, or one they started)
 * and a submitted report both open here, and every change saves as it is made.
 */
export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission({
    smallGroups: ["view"],
    smallGroupReports: ["view", "update"],
  });

  const { id } = await params;
  const report = await loadReport(id);

  // A no meeting only has a reason, which the detail page edits in a dialog.
  if (!report.held) redirect(`/groups/reports/${report.id}`);

  // A closed group's reports are read-only (rule 8): back to the report, which says so.
  if (!report.permissions.canEdit) redirect(`/groups/reports/${report.id}`);

  const today = getChurchToday();
  const [roster, reported, meta, me, permissions] = await Promise.all([
    getReportRoster(report.smallGroup.id, report.meetingDate),
    listReportedDatesAction(report.smallGroup.id, today),
    liveMeta(report, today),
    getMe(),
    getPermissions(),
  ]);
  const { access } = reportAccess(permissions, me);
  const group = report.smallGroup;

  return (
    <ReportFlow
      existing={{ report, roster, meta }}
      groups={[
        {
          id: group.id,
          name: group.name,
          meetingDay: roster.smallGroup.meetingDay,
          meetingAddress: group.meetingAddress,
        },
      ]}
      initialDate={report.meetingDate}
      initialDates={reported}
      initialGroupId={group.id}
      initialRoster={null}
      scoped={access === "scoped"}
      today={today}
    />
  );
}
