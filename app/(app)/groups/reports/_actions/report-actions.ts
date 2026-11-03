"use server";

import type {
  ReportInput,
  ReportList,
  ReportListParams,
} from "@/api/small-groups-api/types";
import type { ReportConflict, ReportErrorKind } from "@/lib/api-error-message";
import type { Locale } from "@/lib/locale-shared";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { forbiddenUnless, hasPermission } from "@/lib/auth/get-permissions";
import { formatCalendarDate } from "@/lib/format-date";
import { ApiError } from "@/api/api-client";
import {
  createSmallGroupReport,
  deleteSmallGroupReport,
  getReportRoster,
  getSmallGroupReport,
  listSmallGroupReports,
  submitSmallGroupReport,
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
  getDraftStarter,
  getExistingReportId,
  getReportConflict,
  getReportErrorKind,
  isExistingReportHeld,
} from "@/lib/api-error-message";

/** A failed write. */
export interface ReportFailure {
  ok: false;
  message: string;
  /**
   * Which problem it is, so the form can put it on the date field, the alert or the save status.
   * `network`: the API couldn't be reached, answered 5xx or 429; worth trying again.
   */
  kind?: ReportErrorKind | "network";
  /** Set with `kind: "exists"`, to link to the report already filed for that date. */
  existingReportId?: number;
  /** Set with `existingReportId`: false when that report is a no meeting, true when held. */
  existingReportHeld?: boolean;
  /** Set with `kind: "conflict"`: who saved first. */
  conflict?: ReportConflict;
  /** Set with `kind: "draftInProgress"`: who started the draft that holds the date. */
  draftStartedBy?: string;
}

/** A created report or draft; the editor keeps the id and version for the next save. */
export type CreateReportResult =
  | { ok: true; id: number; version: number }
  | ReportFailure;

/** A save the API took: the version the next save is based on, and when it was saved. */
export type SaveReportResult =
  | { ok: true; version: number; savedAt: string }
  | ReportFailure;

/** A no meeting saved or its reason changed; the caller closes its dialog or moves on. */
export type NoMeetingResult = { ok: true } | ReportFailure;

export type ReportRosterResult =
  | {
      ok: true;
      roster: Awaited<ReturnType<typeof getReportRoster>>;
      /**
       * "There's already a report for {date}", set whenever the date is taken (rule 1). The new-report
       * flow shows it only for a held report; a no meeting can be replaced instead.
       */
      existsMessage: string | null;
      /** Set when a no meeting holds the date: the mark's reason, null for none. */
      noMeetingReason: string | null;
    }
  | { ok: false; message: string; kind?: ReportErrorKind };

/** Couldn't reach the API, or it answered with something a retry may fix (5xx, 429). */
function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;

  return error.status >= 500 || error.status === 429;
}

async function toFailure(
  error: unknown,
  meetingDate: string,
): Promise<ReportFailure> {
  // A redirect from the session check (signed out mid-report) must reach the client.
  unstable_rethrow(error);

  const kind = getReportErrorKind(error);
  const existingReportId = getExistingReportId(error);
  const existingReportHeld = isExistingReportHeld(error);
  const conflict = getReportConflict(error);
  const draftStartedBy = getDraftStarter(error);

  return {
    ok: false,
    message: await getApiErrorMessage(error, { date: meetingDate }),
    ...(kind
      ? { kind }
      : isRetryable(error)
        ? { kind: "network" as const }
        : {}),
    ...(existingReportId !== null && { existingReportId }),
    ...(existingReportHeld !== null && { existingReportHeld }),
    ...(conflict && { conflict }),
    ...(draftStartedBy !== null && { draftStartedBy }),
  };
}

/** After any change: the list, the report, the group's card and the dashboard. */
function revalidateReports(groupId: number | string, reportId?: number) {
  revalidatePath("/groups/reports");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/");

  if (reportId !== undefined) revalidatePath(`/groups/reports/${reportId}`);
}

/** The reason on the date's no-meeting mark, for the replace prompt; null when none or unreadable. */
async function getNoMeetingReason(
  roster: Awaited<ReturnType<typeof getReportRoster>>,
): Promise<string | null> {
  const existing = roster.existingReport;

  if (!existing || !("id" in existing) || existing.held) return null;

  try {
    return (await getSmallGroupReport(existing.id)).notHeldReason;
  } catch {
    // The reason only adds context to the prompt.
    return null;
  }
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
    // A draft isn't "a report already": the caller's own opens, someone else's has its own note.
    const existsMessage =
      roster.existingReport?.status !== "submitted"
        ? null
        : (await getTranslations("ApiErrors"))("reportExists", {
            date: formatCalendarDate(date, (await getLocale()) as Locale),
          });

    return {
      ok: true,
      roster,
      existsMessage,
      noMeetingReason: await getNoMeetingReason(roster),
    };
  } catch (error) {
    const kind = getReportErrorKind(error);

    return {
      ok: false,
      message: await getApiErrorMessage(error, { date }),
      ...(kind && { kind }),
    };
  }
}

/**
 * Starts a report: a draft (`status: "draft"`, the editor's first change) or, for a body with
 * `status: "submitted"`, a filed report. Returns the id and version; the caller moves on.
 */
export async function createReportAction(
  groupId: number,
  input: ReportInput,
): Promise<CreateReportResult> {
  const forbidden = await forbiddenUnless({ smallGroupReports: ["create"] });

  if (forbidden) return toFailure(forbidden, input.meetingDate);

  const parsed = reportBodySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  let created: { id: number; version: number };

  try {
    created = await createSmallGroupReport(groupId, parsed.data);
  } catch (error) {
    return toFailure(error, input.meetingDate);
  }

  revalidateReports(groupId, created.id);

  return { ok: true, id: created.id, version: created.version };
}

/**
 * One auto-save: replaces the whole report, based on `version` (409 `conflict` when someone saved
 * first). Nothing is revalidated here: a revalidation makes the action re-render the open editor
 * on the server for every save. The lists are dynamic and read fresh on the next visit; leaving
 * the editor through submit, discard or Done revalidates.
 */
export async function saveReportAction(
  id: number,
  version: number,
  input: ReportInput,
): Promise<SaveReportResult> {
  const forbidden = await forbiddenUnless({ smallGroupReports: ["update"] });

  if (forbidden) return toFailure(forbidden, input.meetingDate);

  const parsed = reportBodySchema.safeParse({ ...input, version });

  if (!parsed.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  try {
    const saved = await updateSmallGroupReport(id, parsed.data);

    return {
      ok: true,
      version: saved.version,
      savedAt: saved.lastEditedAt ?? saved.startedAt,
    };
  } catch (error) {
    return toFailure(error, input.meetingDate);
  }
}

/**
 * Submits a draft (one way, auto-save rule 5) and goes to the report with the *submitted* toast.
 * Returns only on failure: `conflict`, `incomplete`, `rosterChanged` (reload and save again).
 */
export async function submitReportAction(
  id: number,
  groupId: number,
  version: number,
): Promise<ReportFailure> {
  const forbidden = await forbiddenUnless({ smallGroupReports: ["create"] });

  if (forbidden) return toFailure(forbidden, "");

  try {
    await submitSmallGroupReport(id, version);
  } catch (error) {
    return toFailure(error, "");
  }

  revalidateReports(groupId, id);
  redirect(`/groups/reports/${id}?saved=submitted`);
}

/** Leaving the editor (Done, Back to My reports): the lists and the report show the saved state. */
export async function leaveReportAction(
  id: number,
  groupId: number,
): Promise<void> {
  revalidateReports(groupId, id);
}

/**
 * Records that the group didn't meet on `date`. A blank reason is sent as none. With
 * `replacesDraft`, the date's draft (one the caller sees) is deleted in the same transaction.
 */
export async function markNoMeeting(
  groupId: number,
  date: string,
  reason: string,
  options: { replacesDraft?: boolean } = {},
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
      ...(options.replacesDraft && { replacesDraft: true }),
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

/** Dates that already have a report (`filed`) or a no-meeting mark, for one group. */
export interface ReportedDates {
  filed: string[];
  noMeeting: string[];
}

/**
 * Dates that already have a report or a no meeting for a group, for the meeting step's calendar.
 * Looks a bit over a year back; the roster's `existingReportId` is what actually blocks a
 * duplicate.
 */
export async function listReportedDatesAction(
  groupId: number,
  today: string,
): Promise<ReportedDates> {
  const none: ReportedDates = { filed: [], noMeeting: [] };

  if (!(await hasPermission({ smallGroupReports: ["view"] }))) return none;

  try {
    const { items } = await listSmallGroupReports({
      smallGroupId: groupId,
      from: addDays(today, -FILED_LOOKBACK_DAYS),
      to: today,
      status: "all",
      pageSize: 100,
    });
    const dates = { ...none };

    for (const item of items) {
      if (item.kind === "report") {
        (item.held ? dates.filed : dates.noMeeting).push(item.meetingDate);
      }
    }

    return dates;
  } catch {
    // The dots and the default date are conveniences; the roster still catches a duplicate.
    return none;
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
