"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { ApiError } from "@/api/api-client";
import { forbiddenUnless } from "@/lib/auth/get-permissions";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  deleteNoMeetingWeek,
  markNoMeetingWeek,
  updateNoMeetingWeekReason,
} from "@/api/small-groups-api/client";
import { REASON_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";

/** A failed call; `gone` when someone already undid the week, so the dialog refreshes on close. */
export interface NoMeetingWeekFailure {
  ok: false;
  message: string;
  gone?: boolean;
}

export type MarkNoMeetingWeekResult =
  | {
      ok: true;
      /** No meetings this call created, for the toast. */
      marked: number;
      /** Reports linked to the week after it, the banner's count. */
      linkedCount: number;
    }
  | NoMeetingWeekFailure;

export type NoMeetingWeekResult = { ok: true } | NoMeetingWeekFailure;

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** At most 255; a blank reason is sent as none. */
const reasonSchema = z
  .string()
  .trim()
  .max(REASON_MAX)
  .transform((reason) => reason || null);

/** Matched on status and a phrase of `detail`, never shown. */
async function toFailure(error: unknown): Promise<NoMeetingWeekFailure> {
  if (error instanceof ApiError) {
    const t = await getTranslations("NoMeetingWeek");
    const detail = JSON.stringify(error.body ?? "").toLowerCase();

    if (
      error.status === 409 &&
      detail.includes("link your account to a member")
    ) {
      return { ok: false, message: t("needsMember") };
    }

    if (error.status === 422 && detail.includes("future")) {
      return { ok: false, message: t("tooFarAhead") };
    }

    if (error.status === 404) {
      return { ok: false, message: t("gone"), gone: true };
    }
  }

  return { ok: false, message: await getApiErrorMessage(error) };
}

/** One call touches every group: the dashboard, every report page and every group page. */
function revalidateWeek() {
  revalidatePath("/");
  revalidatePath("/groups/reports", "layout");
  revalidatePath("/groups/[id]", "layout");
}

/**
 * Marks the week containing `date` as no meeting for every group still empty in it. On a re-run the
 * API keeps the week's reason and ignores `reason`.
 */
export async function markNoMeetingWeekAction(
  date: string,
  reason: string,
): Promise<MarkNoMeetingWeekResult> {
  const forbidden = await forbiddenUnless({
    smallGroups: ["all"],
    smallGroupReports: ["create"],
  });

  if (forbidden) return toFailure(forbidden);

  const parsedDate = dateSchema.safeParse(date);
  const parsedReason = reasonSchema.safeParse(reason);

  if (!parsedDate.success || !parsedReason.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  let marked: number;
  let linkedCount: number;

  try {
    ({ marked, linkedCount } = await markNoMeetingWeek(
      parsedDate.data,
      parsedReason.data,
    ));
  } catch (error) {
    return toFailure(error);
  }

  revalidateWeek();

  return { ok: true, marked, linkedCount };
}

/** Changes the reason on the week and every report still linked to it; blank clears it. */
export async function updateNoMeetingWeekReasonAction(
  id: number,
  reason: string,
): Promise<NoMeetingWeekResult> {
  const forbidden = await forbiddenUnless({
    smallGroups: ["all"],
    smallGroupReports: ["update"],
  });

  if (forbidden) return toFailure(forbidden);

  const parsed = reasonSchema.safeParse(reason);

  if (!parsed.success) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  try {
    await updateNoMeetingWeekReason(id, parsed.data);
  } catch (error) {
    return toFailure(error);
  }

  revalidateWeek();

  return { ok: true };
}

/** Undo: deletes the no meetings still linked to the week, then the week. */
export async function undoNoMeetingWeekAction(
  id: number,
): Promise<NoMeetingWeekResult> {
  const forbidden = await forbiddenUnless({
    smallGroups: ["all"],
    smallGroupReports: ["delete"],
  });

  if (forbidden) return toFailure(forbidden);

  try {
    await deleteNoMeetingWeek(id);
  } catch (error) {
    return toFailure(error);
  }

  revalidateWeek();

  return { ok: true };
}
