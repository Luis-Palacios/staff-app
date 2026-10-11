import type { Locale } from "@/lib/locale-shared";

// The time zone is still the browser's (the server doesn't know it); only the
// language comes from the picker, so dates match the rest of the UI.
function formatLocal(
  iso: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return "";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatLocalDateTime(iso: string, locale: Locale): string {
  return formatLocal(iso, locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatLocalDate(iso: string, locale: Locale): string {
  return formatLocal(iso, locale, { dateStyle: "medium" });
}

export function formatLocalTime(iso: string, locale: Locale): string {
  return formatLocal(iso, locale, { timeStyle: "short" });
}

// "Oct 8": compact date for list rows where the year is implied.
export function formatLocalShortDate(iso: string, locale: Locale): string {
  return formatLocal(iso, locale, { month: "short", day: "numeric" });
}

// "Thursday, October 9": today's date in the dashboard eyebrow.
export function formatLocalLongDate(iso: string, locale: Locale): string {
  return formatLocal(iso, locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
