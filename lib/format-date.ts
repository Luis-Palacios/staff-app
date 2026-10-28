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

// "Oct 8, 2026" ("8 oct 2026").
export function formatCalendarMediumDate(iso: string, locale: Locale): string {
  return formatCalendarWith(iso, locale, {
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

// "Sunday, Oct 4": the church Sunday in a question or a column title.
export function formatCalendarWeekdayDate(iso: string, locale: Locale): string {
  return formatCalendarWith(iso, locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// "Friday" ("viernes"): a day this week, inside a sentence.
export function formatCalendarWeekday(iso: string, locale: Locale): string {
  return formatCalendarWith(iso, locale, { weekday: "long" });
}

// "Sun, Oct 4": the church Sunday in a narrow column title.
export function formatCalendarShortWeekdayDate(
  iso: string,
  locale: Locale,
): string {
  return formatCalendarWith(iso, locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// "October 2026" ("octubre 2026", not "octubre de 2026"): a month heading.
export function formatCalendarMonth(iso: string, locale: Locale): string {
  const parts = formatCalendarWith(iso, locale, {
    month: "long",
    year: "numeric",
  });

  // Intl's Spanish joins month and year with "de"; the headings drop it.
  return locale === "es" ? parts.replace(/ de (\d{4})$/, " $1") : parts;
}

// "Tue, Oct 27", and "mar 27 oct" in Spanish (no comma): a row date on the person timeline.
export function formatCalendarRowDate(iso: string, locale: Locale): string {
  const text = formatCalendarShortWeekdayDate(iso, locale);

  return locale === "es" ? text.replace(",", "") : text;
}

/**
 * A date range: "Oct 20 – Oct 28, 2026" ("20 oct – 28 oct, 2026"), the year once when both ends
 * share it, on each end when they don't. Each end is formatted alone: `formatRange` spaces its
 * dash differently in Node and in the browser, which breaks hydration.
 */
export function formatCalendarSpan(
  fromIso: string,
  toIso: string,
  locale: Locale,
): string {
  const year = (iso: string) => iso.slice(0, 4);

  if (year(fromIso) !== year(toIso)) {
    const full = (iso: string) =>
      formatCalendarWith(iso, locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    return `${full(fromIso)} – ${full(toIso)}`;
  }

  return `${formatCalendarShortDate(fromIso, locale)} – ${formatCalendarShortDate(toIso, locale)}, ${year(toIso)}`;
}

// "Oct 11 – 17" (or "Oct 28 – Nov 3"): a week's range from two date-only values, in the picked
// language's own range format.
export function formatCalendarRange(
  startIso: string,
  endIso: string,
  locale: Locale,
): string {
  const parse = (iso: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

    return match
      ? new Date(
          Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
        )
      : null;
  };
  const start = parse(startIso);
  const end = parse(endIso);

  if (!start || !end) return "";

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).formatRange(start, end);
}
