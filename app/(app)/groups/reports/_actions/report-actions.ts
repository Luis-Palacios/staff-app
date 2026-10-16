"use server";

import type { ReportInput } from "@/api/small-groups-api/types";
import type { ReportErrorKind } from "@/lib/api-error-message";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSmallGroupReport,
  deleteSmallGroupReport,
  getReportRoster,
  updateSmallGroupReport,
} from "@/api/small-groups-api/client";
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
  | { ok: true; roster: Awaited<ReturnType<typeof getReportRoster>> }
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
    return { ok: true, roster: await getReportRoster(groupId, date) };
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
