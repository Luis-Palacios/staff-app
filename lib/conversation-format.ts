import type { ConversationInboxItem } from "@/api/conversations-api/types";

// Excerpts come cut at 160 characters with no ellipsis; the UI adds it.
const EXCERPT_LIMIT = 160;

export function excerptText(excerpt: string): string {
  return excerpt.length >= EXCERPT_LIMIT ? `${excerpt}…` : excerpt;
}

/** The time of a comment today ("7:02 AM"), else the day ("Oct 12"), in the church's time zone. */
export function formatActivity(
  iso: string,
  locale: string,
  timeZone: string,
  now: Date = new Date(),
): string {
  const date = new Date(iso);
  const sameDay =
    new Intl.DateTimeFormat("en-CA", { timeZone }).format(date) ===
    new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);

  return new Intl.DateTimeFormat(
    locale,
    sameDay
      ? { hour: "numeric", minute: "2-digit", timeZone }
      : { month: "short", day: "numeric", timeZone },
  ).format(date);
}

/** Link to the report with this person's panel open. */
export function conversationHref(item: ConversationInboxItem): string {
  return `/groups/reports/${item.report.id}?person=${item.member.id}`;
}
