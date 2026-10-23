import type {
  ConversationAnchor,
  ConversationSummary,
} from "@/api/conversations-api/types";

import { CheckIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { tv } from "tailwind-variants";

export interface ConversationIndicatorLabels {
  /** "Start a conversation about {first}", already filled in. */
  start: string;
  /** "Conversation about {first}: 3 comments, needs your reply", already filled in. */
  row: string;
}

const pill = tv({
  base: "relative inline-flex items-center gap-1.5 rounded-full font-semibold tabular-nums",
  variants: {
    tone: {
      open: "bg-accent-soft text-accent-soft-foreground",
      reply: "bg-warning-soft text-warning-soft-foreground",
      resolved: "bg-success-soft text-success-soft-foreground",
    },
    size: {
      // The table cell (a 34px pill) and the phone card (a 44px control).
      table: "h-[34px] pl-2.5 pr-3 text-[13px]",
      card: "h-11 pl-3 pr-3.5 text-sm",
    },
  },
});

const startLink = tv({
  base: "inline-flex items-center justify-center rounded-tile text-subtle hover:bg-default hover:text-heading",
  variants: { size: { table: "size-10", card: "size-11" } },
});

// A bubble with a plus: starting a conversation. Heroicons has no such glyph, so the plus is
// drawn into the outline bubble's own path.
function StartBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      <path d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z M12 6.75v6m3-3H9" />
    </svg>
  );
}

// The conversation control of an attendance row or a report section: none / open / needs your
// reply (`needsMyReply` drives the color, `unread` the gold dot) / resolved. Always a link to
// `?person=` or `?section=` that keeps the scroll position, which opens the panel. The data
// attribute is where the panel returns the focus. No hooks, so the table and the cards both render it.
export function ConversationIndicator({
  anchor,
  summary,
  labels,
  size = "table",
}: {
  anchor: ConversationAnchor;
  summary: ConversationSummary | undefined;
  labels: ConversationIndicatorLabels;
  size?: "table" | "card";
}) {
  const href =
    anchor.type === "attendance"
      ? `?person=${anchor.memberId}`
      : `?section=${anchor.key}`;
  const data =
    anchor.type === "attendance"
      ? { "data-conversation-member": anchor.memberId }
      : { "data-conversation-section": anchor.key };

  if (!summary) {
    return (
      <NextLink
        aria-label={labels.start}
        className={startLink({ size })}
        {...data}
        href={href}
        scroll={false}
        title={labels.start}
      >
        <StartBubbleIcon
          className={size === "card" ? "size-[21px]" : "size-5"}
        />
      </NextLink>
    );
  }

  const resolved = summary.status === "resolved";
  const Icon = resolved ? CheckIcon : ChatBubbleLeftIcon;

  return (
    <NextLink
      aria-label={labels.row}
      className={pill({
        size,
        tone: resolved ? "resolved" : summary.needsMyReply ? "reply" : "open",
      })}
      {...data}
      href={href}
      scroll={false}
    >
      <Icon
        aria-hidden="true"
        className={size === "card" ? "size-[17px]" : "size-4"}
        strokeWidth={1.8}
      />
      {summary.commentCount}
      {summary.unread && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 size-[11px] rounded-full border-2 border-surface bg-gold-500"
        />
      )}
    </NextLink>
  );
}
