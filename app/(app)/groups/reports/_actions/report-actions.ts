"use server";

import type {
  ReportInput,
  ReportList,
  ReportListParams,
} from "@/api/small-groups-api/types";
import type { ReportErrorKind } from "@/lib/api-error-message";
import type { Locale } from "@/lib/locale-shared";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { formatCalendarDate } from "@/lib/format-date";
import {
  createSmallGroupReport,
  deleteSmallGroupReport,
  getReportRoster,
  listSmallGroupReports,
  updateSmallGroupReport,
} from "@/api/small-groups-api/client";
import {
  addDays,
  FILED_LOOKBACK_DAYS,
} from "@/app/(app)/groups/reports/_lib/meeting-dates";
import { reportBodySchema } from "@/app/(app)/groups/reports/_lib/report-schema";
import {
  getApiErrorMessage,
  getExistingReportId,
  getReportErrorKind,
} from "@/lib/api-error-message";

/** A failed save. Success never returns: it redirects to the report. */
export interface ReportFailure {
  ok: false;
  message: string;
  /** Which problem it is, so the form can put it on the date field or the alert. */
  kind?: ReportErrorKind;
  /** Set with `kind: "exists"`, to link to the report already filed for that date. */
  existingReportId?: number;
}

export type ReportRosterResult =
  | {
      ok: true;
      roster: Awaited<ReturnType<typeof getReportRoster>>;
      /** "There's already a report for {date}", set with `roster.existingReportId` (rule 1). */
      existsMessage: string | null;
    }
  | { ok: false; message: string; kind?: ReportErrorKind };

async function toFailure(
  error: unknown,
  meetingDate: string,
): Promise<ReportFailure> {
  const kind = getReportErrorKind(error);
  const existingReportId = getExistingReportId(error);

  return {
    ok: false,
    message: await getApiErrorMessage(error, { date: meetingDate }),
    ...(kind && { kind }),
    ...(existingReportId !== null && { existingReportId }),
  };
}

/** After any change: the list, the report, the group's card and the dashboard. */
function revalidateReports(groupId: number | string, reportId?: number) {
  revalidatePath("/groups/reports");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");

  if (reportId !== undefined) revalidatePath(`/groups/reports/${reportId}`);
}

/** The roster for a date, called as the date or group changes on the meeting step. */
export async function getReportRosterAction(
  groupId: number,
  date: string,
): Promise<ReportRosterResult> {
  try {
    const roster = await getReportRoster(groupId, date);
    const existsMessage =
      roster.existingReportId === null
        ? null
        : (await getTranslations("ApiErrors"))("reportExists", {
            date: formatCalendarDate(date, (await getLocale()) as Locale),
          });

    return { ok: true, roster, existsMessage };
  } catch (error) {
    const kind = getReportErrorKind(error);

    return {
      ok: false,
      message: await getApiErrorMessage(error, { date }),
      ...(kind && { kind }),
    };
  }
}

export async function createReportAction(
  groupId: number,
  input: ReportInput,
): Promise<ReportFailure> {
  const parsed = reportBodySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  let id: number;

  try {
    ({ id } = await createSmallGroupReport(groupId, parsed.data));
  } catch (error) {
    return toFailure(error, input.meetingDate);
  }

  revalidateReports(groupId, id);
  redirect(`/groups/reports/${id}?saved=submitted`);
}

export async function updateReportAction(
  id: number,
  groupId: number,
  input: ReportInput,
): Promise<ReportFailure> {
  const parsed = reportBodySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  try {
    await updateSmallGroupReport(id, parsed.data);
  } catch (error) {
    return toFailure(error, input.meetingDate);
  }

  revalidateReports(groupId, id);
  redirect(`/groups/reports/${id}?saved=updated`);
}

export async function deleteReportAction(
  id: number,
  groupId: number,
): Promise<ReportFailure> {
  try {
    await deleteSmallGroupReport(id);
  } catch (error) {
    return toFailure(error, "");
  }

  revalidateReports(groupId, id);
  redirect("/groups/reports?saved=deleted");
}

/**
 * Dates that already have a report for a group, for the meeting step's calendar. Looks a bit over
 * a year back; the roster's `existingReportId` is what actually blocks a duplicate.
 */
export async function listFiledDatesAction(
  groupId: number,
  today: string,
): Promise<string[]> {
  try {
    const { items } = await listSmallGroupReports({
      smallGroupId: groupId,
      from: addDays(today, -FILED_LOOKBACK_DAYS),
      to: today,
      status: "filed",
      pageSize: 100,
    });

    return items.map((item) => item.meetingDate);
  } catch {
    // The dots and the default date are conveniences; the roster still catches a duplicate.
    return [];
  }
}

/** One more page of the list, for "Show more" on phones. */
export async function listReportsPageAction(
  params: ReportListParams,
): Promise<{ ok: true; data: ReportList } | { ok: false; message: string }> {
  try {
    return { ok: true, data: await listSmallGroupReports(params) };
  } catch (error) {
    return { ok: false, message: await getApiErrorMessage(error) };
  }
}
