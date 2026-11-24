import type { CareLogEntry, CareLogKind } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

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

/** Soonest first, for *Coming up*: by date, then by time (no time sorts first). */
export function compareComingUp(a: CareLogEntry, b: CareLogEntry): number {
  return (
    a.occurredOn.localeCompare(b.occurredOn) ||
    (a.occurredAtTime ?? "").localeCompare(b.occurredAtTime ?? "")
  );
}
