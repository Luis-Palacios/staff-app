import "server-only";

import type { Locale } from "@/lib/locale-shared";

import { cache } from "react";
import { cookies, headers } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/lib/locale-shared";

export * from "@/lib/locale-shared";

/**
 * First language in an Accept-Language header that we support, by primary
 * subtag ("es-NI" → "es"). Walks the list in the browser's order rather than
 * sorting by q-value: browsers already send it most-preferred first. Entries
 * with q=0 mean "not this one" and are skipped.
 */
function localeFromAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;

  for (const entry of header.split(",")) {
    const [tag, ...params] = entry.trim().split(";");
    const q = params.find((param) => param.trim().startsWith("q="));

    if (q && Number(q.trim().slice(2)) === 0) continue;

    const primary = tag.trim().split("-")[0].toLowerCase();

    if (isLocale(primary)) return primary;
  }

  return undefined;
}

/**
 * The language for this request: the `ekk_locale` cookie when it holds a
 * supported value, otherwise the browser's Accept-Language (how Chrome's
 * language setting reaches us), otherwise English. Resolved on the server so
 * the first render, and `<html lang>`, are already right.
 *
 * `cache()` shares one call per request between the root layout and the
 * (app) layout.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;

  if (isLocale(fromCookie)) return fromCookie;

  return (
    localeFromAcceptLanguage((await headers()).get("accept-language")) ??
    DEFAULT_LOCALE
  );
});
