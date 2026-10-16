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

import { forbiddenUnless, hasPermission } from "@/lib/auth/get-permissions";
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
import {
  noMeetingSchema,
  reportBodySchema,
} from "@/app/(app)/groups/reports/_lib/report-schema";
import {
  getApiErrorMessage,
  getExistingReportId,
  getReportErrorKind,
  isExistingReportHeld,
} from "@/lib/api-error-message";

/** A failed save. Success never returns: it redirects to the report. */
export interface ReportFailure {
  ok: false;
  message: string;
  /** Which problem it is, so the form can put it on the date field or the alert. */
  kind?: ReportErrorKind;
  /** Set with `kind: "exists"`, to link to the report already filed for that date. */
  existingReportId?: number;
  /** Set with `existingReportId`: false when that report is a no meeting, true when held. */
  existingReportHeld?: boolean;
}

/** A no meeting saved or its reason changed; the caller closes its dialog or moves on. */
export type NoMeetingResult = { ok: true } | ReportFailure;

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
  const existingReportHeld = isExistingReportHeld(error);

  return {
    ok: false,
    message: await getApiErrorMessage(error, { date: meetingDate }),
    ...(kind && { kind }),
    ...(existingReportId !== null && { existingReportId }),
    ...(existingReportHeld !== null && { existingReportHeld }),
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
  const forbidden = await forbiddenUnless({ smallGroupReports: ["view"] });

  if (forbidden) {
    return { ok: false, message: await getApiErrorMessage(forbidden) };
  }

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
  const forbidden = await forbiddenUnless({ smallGroupReports: ["create"] });

  if (forbidden) return toFailure(forbidden, input.meetingDate);

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

/** Records that the group didn't meet on `date`. A blank reason is sent as none. */
export async function markNoMeeting(
  groupId: number,
  date: string,
  reason: string,
): Promise<NoMeetingResult> {
  const forbidden = await forbiddenUnless({ smallGroupReports: ["create"] });

  if (forbidden) return toFailure(forbidden, date);

  const parsed = noMeetingSchema.safeParse({
    meetingDate: date,
    notHeldReason: reason,
  });

  if (!parsed.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  let id: number;

  try {
    ({ id } = await createSmallGroupReport(groupId, {
      held: false,
      ...parsed.data,
    }));
  } catch (error) {
    return toFailure(error, date);
  }

  revalidateReports(groupId, id);

  return { ok: true };
}

/** Edits the reason of a no meeting (and keeps its date). */
export async function updateNoMeetingReason(
  id: number,
  groupId: number,
  date: string,
  reason: string,
): Promise<NoMeetingResult> {
  const forbidden = await forbiddenUnless({ smallGroupReports: ["update"] });

  if (forbidden) return toFailure(forbidden, date);

  const parsed = noMeetingSchema.safeParse({
    meetingDate: date,
    notHeldReason: reason,
  });

  if (!parsed.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  try {
    await updateSmallGroupReport(id, {
      held: false,
      meetingDate: parsed.data.meetingDate,
      // PATCH replaces the report, so an emptied reason has to be an explicit null.
      notHeldReason: parsed.data.notHeldReason ?? null,
    });
  } catch (error) {
    return toFailure(error, date);
  }

  revalidateReports(groupId, id);

  return { ok: true };
}

export async function updateReportAction(
  id: number,
  groupId: number,
  input: ReportInput,
): Promise<ReportFailure> {
  const forbidden = await forbiddenUnless({ smallGroupReports: ["update"] });

  if (forbidden) return toFailure(forbidden, input.meetingDate);

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
  const forbidden = await forbiddenUnless({ smallGroupReports: ["delete"] });

  if (forbidden) return toFailure(forbidden, "");

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
  if (!(await hasPermission({ smallGroupReports: ["view"] }))) return [];

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
  const forbidden = await forbiddenUnless({ smallGroupReports: ["view"] });

  if (forbidden) {
    return { ok: false, message: await getApiErrorMessage(forbidden) };
  }

  try {
    return { ok: true, data: await listSmallGroupReports(params) };
  } catch (error) {
    return { ok: false, message: await getApiErrorMessage(error) };
  }
}
