import "server-only";

import { getTranslations } from "next-intl/server";

import { ApiError } from "@/api/api-client";

/**
 * Turns an error from membership-management into text in the current
 * language. That API sends English `detail` strings and no codes, so this maps
 * by HTTP status and falls back to a generic message (I18N-ROADMAP, "Errors
 * from the APIs"). Never shows the backend's text.
 */
export async function getApiErrorMessage(error: unknown): Promise<string> {
  const t = await getTranslations("ApiErrors");

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

      return t("forbidden");
    }

    if (error.status === 409) {
      // membership-management has two 409s on the link route and no codes, so tell them apart by
      // which side the detail names; it is only matched, never shown.
      const detail = JSON.stringify(error.body ?? "").toLowerCase();

      if (detail.includes("this member is already linked")) {
        return t("memberAlreadyLinked");
      }

      if (detail.includes("this user is already linked")) {
        return t("userAlreadyLinked");
      }
    }

    if (error.status === 404) return t("notFound");
    if (error.status === 429) return t("tooManyRequests");
    if (error.status === 503) return t("serviceUnavailable");
  }

  return t("generic");
}
