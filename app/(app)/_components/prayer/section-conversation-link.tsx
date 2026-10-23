import type { ReportSharedConversation } from "@/api/small-groups-api/types";

import {
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { tv } from "tailwind-variants";

const control = tv({
  base: "relative inline-flex min-h-11 items-center gap-[7px] rounded-[10px] px-3 text-[13.5px] font-semibold tabular-nums transition-colors md:min-h-10",
  variants: {
    tone: {
      start: "border border-border text-heading hover:bg-default",
      open: "bg-accent-soft text-accent-soft-foreground",
      reply: "bg-warning-soft text-warning-soft-foreground",
      resolved: "bg-success-soft text-success-soft-foreground",
    },
  },
});

/**
 * An entry's conversation control (rule 15): *Start a conversation* with no thread, else the
 * comment count in the row indicator's tones (amber when it needs your reply, a gold dot when
 * unread, green when resolved). Both open the panel on this page; the data attributes are where
 * the panel returns the focus.
 */
export function SectionConversationLink({
  href,
  reportId,
  section,
  conversation,
  label,
  ariaLabel,
}: {
  href: string;
  reportId: number;
  section: string;
  conversation: ReportSharedConversation | undefined;
  /** *Start a conversation*, or "3 comments". */
  label: string;
  ariaLabel: string;
}) {
  const tone = !conversation
    ? "start"
    : conversation.status === "resolved"
      ? "resolved"
      : conversation.needsMyReply
        ? "reply"
        : "open";
  const Icon = !conversation
    ? ChatBubbleLeftEllipsisIcon
    : tone === "resolved"
      ? CheckIcon
      : ChatBubbleLeftRightIcon;

  return (
    <NextLink
      aria-label={ariaLabel}
      className={control({ tone })}
      data-conversation-report={reportId}
      data-conversation-section={section}
      href={href}
      scroll={false}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
      {label}
      {conversation?.unread && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 size-[11px] rounded-full border-2 border-surface bg-gold-500"
        />
      )}
    </NextLink>
  );
}
