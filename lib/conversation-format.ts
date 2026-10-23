import type {
  ConversationAnchor,
  ConversationInboxItem,
} from "@/api/conversations-api/types";
import type { Person } from "@/api/small-groups-api/types";

/** Who a person thread is about, as the API anchors it: `memberId` or `guestId`, never both. */
export type ConversationTarget = Pick<Person, "id" | "type">;

export function personAnchor(
  target: ConversationTarget,
): Extract<ConversationAnchor, { type: "attendance" }> {
  return target.type === "guest"
    ? { type: "attendance", guestId: target.id }
    : { type: "attendance", memberId: target.id };
}

export function anchorTarget(
  anchor: Extract<ConversationAnchor, { type: "attendance" }>,
): ConversationTarget {
  return anchor.guestId !== undefined
    ? { type: "guest", id: anchor.guestId }
    : { type: "member", id: anchor.memberId };
}

/** The query that opens a person's panel. A member keeps `?person=12`; a guest is `?guest=5`. */
export function personQuery(target: ConversationTarget): string {
  return target.type === "guest" ? `guest=${target.id}` : `person=${target.id}`;
}

/** Value of the `data-conversation-person` attribute the panel returns the focus to. */
export function personFocusKey(target: ConversationTarget): string {
  return `${target.type}:${target.id}`;
}

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

/** Link to the report with this person's or section's panel open. */
export function conversationHref(item: ConversationInboxItem): string {
  const { anchor } = item;

  return anchor.type === "attendance"
    ? `/groups/reports/${item.report.id}?${personQuery(anchorTarget(anchor))}`
    : `/groups/reports/${item.report.id}?section=${anchor.key}`;
}
