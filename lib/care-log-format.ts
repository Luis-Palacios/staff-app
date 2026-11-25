import type { CareLogEntry, CareLogKind } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import { formatCalendarRowDate } from "@/lib/format-date";

/** "12:30" or "12:30:00" as the church reads it: "12:30 PM" in English, "12:30 p. m." in Spanish. */
export function formatCareTime(time: string, locale: Locale): string {
  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    // Any fixed zone: the value is a wall-clock time, not an instant.
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)));
}

/** "4p", "7:30p" ("4 p. m.") for a month cell, where there is no room for "4:00 PM". */
export function formatShortCareTime(time: string, locale: Locale): string {
  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const clock = `${((hours + 11) % 12) + 1}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;

  if (locale === "es") return `${clock} ${hours < 12 ? "a. m." : "p. m."}`;

  return `${clock}${hours < 12 ? "a" : "p"}`;
}

/**
 * The `CareLog` message key of an entry's title: "Planned call" for a plan (cancelled ones keep
 * the planned wording), "Phone call" once it is done; kinds that can't be planned have one title.
 */
export function careTitleKey(entry: Pick<CareLogEntry, "kind" | "status">) {
  return entry.status !== "done" && isPlannableKind(entry.kind)
    ? (`titlesPlanned.${entry.kind}` as const)
    : (`titles.${entry.kind}` as const);
}

/** "Sat, Oct 17 · 4:00 PM", or the date alone when the entry has no time. */
export function formatCareWhen(
  entry: Pick<CareLogEntry, "occurredOn" | "occurredAtTime">,
  locale: Locale,
): string {
  const date = formatCalendarRowDate(entry.occurredOn, locale);

  return entry.occurredAtTime
    ? `${date} · ${formatCareTime(entry.occurredAtTime, locale)}`
    : date;
}

/** Only call, meeting and visit have a "planned" wording (rule 6). */
export function isPlannableKind(
  kind: CareLogKind,
): kind is "call" | "meeting" | "visit" {
  return kind === "call" || kind === "meeting" || kind === "visit";
}

/**
 * A plan dated after today: the timeline's *Coming up* block. Past-due plans and today's stay in
 * their month, where the API lists them.
 */
export function isComingUp(entry: CareLogEntry, today: string): boolean {
  return entry.status === "planned" && entry.occurredOn > today;
}

/**
 * Whether *Record how it went* is offered (rule 6): on a plan the caller may complete once it is past
 * due (the API's `pastDue`: its time passed, or its day is over) and, earlier, on the plan's own day,
 * so a 3 PM call can be recorded right after it. The amber badge still follows `pastDue` alone.
 */
export function canRecordNow(entry: CareLogEntry, today: string): boolean {
  return (
    entry.status === "planned" &&
    entry.canComplete &&
    (entry.pastDue || entry.occurredOn === today)
  );
}

/** Soonest first, for *Coming up*: by date, then by time (no time sorts first). */
export function compareComingUp(a: CareLogEntry, b: CareLogEntry): number {
  return (
    a.occurredOn.localeCompare(b.occurredOn) ||
    (a.occurredAtTime ?? "").localeCompare(b.occurredAtTime ?? "")
  );
}
