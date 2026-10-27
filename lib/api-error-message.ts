import "server-only";

import { getTranslations } from "next-intl/server";

import { ApiError } from "@/api/api-client";
import { formatCalendarDate } from "@/lib/format-date";
import { getLocale } from "@/lib/locale";

/** The report errors the form tells apart (cross-repo spec, "Errors the staff app tells apart"). */
export type ReportErrorKind =
  | "exists"
  | "needsMember"
  | "closed"
  | "future"
  | "rosterChanged"
  | "notLeaderOnDate"
  | "tag"
  | "items";

/** Matched on status and a phrase of `detail`, never shown. Null for any other error. */
export function getReportErrorKind(error: unknown): ReportErrorKind | null {
  if (!(error instanceof ApiError)) return null;

  const detail = JSON.stringify(error.body ?? "").toLowerCase();

  if (error.status === 409) {
    if (detail.includes("already a report")) return "exists";
    if (detail.includes("link your account to a member")) return "needsMember";
    if (detail.includes("closed")) return "closed";
  }

  if (error.status === 422) {
    // "Too many items or tags in {section}" and "{section} is too long: items can be up to…" first:
    // the tag texts below ("Unknown person to tag", "is inactive and can't be tagged") differ.
    if (detail.includes("too many items") || detail.includes("items can be")) {
      return "items";
    }

    if (detail.includes("to tag") || detail.includes("be tagged")) return "tag";

    if (detail.includes("future")) return "future";
    if (detail.includes("attendance")) return "rosterChanged";
    if (detail.includes("didn't lead")) return "notLeaderOnDate";
  }

  return null;
}

/** The id in a duplicate-date 409 (`existingReportId`), so the form can link to it. */
export function getExistingReportId(error: unknown): number | null {
  if (!(error instanceof ApiError) || typeof error.body !== "object") {
    return null;
  }

  const id = (error.body as { existingReportId?: unknown } | null)
    ?.existingReportId;

  return typeof id === "number" ? id : null;
}

/** True when a duplicate-date 409 says the existing report is a held one (`existingReportHeld`). */
export function isExistingReportHeld(error: unknown): boolean | null {
  if (!(error instanceof ApiError) || typeof error.body !== "object") {
    return null;
  }

  const held = (error.body as { existingReportHeld?: unknown } | null)
    ?.existingReportHeld;

  return typeof held === "boolean" ? held : null;
}

/**
 * Turns an error from membership-management into text in the current
 * language. That API sends English `detail` strings and no codes, so this maps
 * by HTTP status and falls back to a generic message (I18N-ROADMAP, "Errors
 * from the APIs"). Never shows the backend's text.
 */
export async function getApiErrorMessage(
  error: unknown,
  context: { date?: string } = {},
): Promise<string> {
  const t = await getTranslations("ApiErrors");
  const reportError = getReportErrorKind(error);

  if (reportError) {
    switch (reportError) {
      case "exists":
        return t("reportExists", {
          date: context.date
            ? formatCalendarDate(context.date, await getLocale())
            : "",
        });
      case "needsMember":
        return t("reportNeedsMember");
      case "closed":
        return t("groupClosed");
      case "future":
        return t("reportFutureDate");
      case "rosterChanged":
        return t("reportRosterChanged");
      case "notLeaderOnDate":
        return t("reportNotLeaderOnDate");
      case "tag":
        return (await getTranslations("ReportItems"))("errorTag");
      case "items":
        return (await getTranslations("ReportItems"))("errorLimit");
    }
  }

  if (error instanceof ApiError) {
    if (error.status === 403) {
      // The member routes have two 403s for scoped callers and no codes; matched, never shown.
      const detail = JSON.stringify(error.body ?? "").toLowerCase();

      if (detail.includes("only admins and elders can change who leads")) {
        return t("leadershipAdminsOnly");
      }

      if (detail.includes("change your own role in this group")) {
        return t("ownGroupRole");
      }

      if (detail.includes("linked to a user")) {
        return t("memberEmailLinked");
      }

      return t("forbidden");
    }

    if (error.status === 409) {
      // membership-management has two 409s on the link route and no codes, so tell them apart by
      // which side the detail names; it is only matched, never shown.
      const detail = JSON.stringify(error.body ?? "").toLowerCase();

      // The inactive-members 409s carry a machine-readable `code`.
      switch ((error.body as { code?: unknown } | null)?.code) {
        case "member_inactive":
          return t("memberInactive");
        case "self":
          return t("memberSelfInactive");
        case "already_inactive":
          return t("memberAlreadyInactive");
        case "already_active":
          return t("memberAlreadyActive");
      }

      if (detail.includes("this member is already linked")) {
        return t("memberAlreadyLinked");
      }

      if (detail.includes("this user is already linked")) {
        return t("userAlreadyLinked");
      }
    }

    // Only the deactivate route has a date a person types (cross-repo spec: 422 for a future date).
    if (error.status === 422 && error.url.endsWith("/deactivate")) {
      return t("memberFutureDate");
    }

    if (error.status === 404) return t("notFound");
    if (error.status === 429) return t("tooManyRequests");
    if (error.status === 503) return t("serviceUnavailable");
  }

  return t("generic");
}
