// Locale constants and types, safe to import from client components. The
// request-time resolution (cookie → Accept-Language → default) lives in
// lib/locale.ts, which is server-only.

export const LOCALES = ["en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie holding the language the user picked in the account menu. Only
 *  written when they pick; until then the browser's language decides. */
export const LOCALE_COOKIE = "ekk_locale";

/** Each language's name in that language, plus the short tag the menu shows
 *  in place of an icon. */
export const LOCALE_LABELS: Record<Locale, { label: string; tag: string }> = {
  en: { label: "English", tag: "EN" },
  es: { label: "Español", tag: "ES" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}
