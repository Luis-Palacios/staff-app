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

// Date-only values ("YYYY-MM-DD": birth dates, join dates) have no time or
// zone, so they must not go through `new Date(iso)` and the local-time
// formatters above: midnight UTC reads as the previous day west of Greenwich.
// Build the date at UTC midnight and format it in UTC so the calendar day
// never shifts.
export function formatCalendarDate(iso: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) return "";

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

// Whole years between a date-only birth date and today (in the server's
// calendar). `null` when the value isn't a date.
export function ageFromCalendarDate(
  iso: string,
  today: Date = new Date(),
): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) return null;

  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const hadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}

// Date-only values in a shorter or longer form than `formatCalendarDate`, with the same UTC
// handling so the calendar day never shifts.
function formatCalendarWith(
  iso: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) return "";

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );

  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: "UTC",
  }).format(date);
}

// "Oct 8": a date-only value in a list row.
export function formatCalendarShortDate(iso: string, locale: Locale): string {
  return formatCalendarWith(iso, locale, { month: "short", day: "numeric" });
}

// "Thu, Oct 8, 2026".
export function formatCalendarMediumDate(iso: string, locale: Locale): string {
  return formatCalendarWith(iso, locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "Thursday, October 8, 2026": the report detail title.
export function formatCalendarFullDate(iso: string, locale: Locale): string {
  return formatCalendarWith(iso, locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
