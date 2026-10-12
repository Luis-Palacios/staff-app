import "server-only";

import { getTranslations } from "next-intl/server";

import { ApiError } from "@/api/api-client";

/**
 * Turns an error from membership-applications into text in the current
 * language. That API sends English `detail` strings and no codes, so this maps
 * by HTTP status and falls back to a generic message (I18N-ROADMAP, "Errors
 * from the APIs"). Never shows the backend's text.
 */
export async function getApiErrorMessage(error: unknown): Promise<string> {
  const t = await getTranslations("ApiErrors");

  if (error instanceof ApiError) {
    if (error.status === 404) return t("notFound");
    if (error.status === 429) return t("tooManyRequests");
    if (error.status === 503) return t("serviceUnavailable");
  }

  return t("generic");
}
