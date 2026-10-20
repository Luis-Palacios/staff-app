import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

// "3 conversations" and "1 needs your reply" above the privacy line. The caller hides it at 0
// conversations; the second pill is hidden at 0 replies.
export function ConversationSummary({
  total,
  reply,
  needsReply,
}: {
  /** Already translated: "3 conversations". */
  total: string;
  /** Already translated: "1 needs your reply". */
  reply: string;
  needsReply: boolean;
}) {
  return (
    <span className="flex flex-wrap items-center justify-end gap-2 text-[13px]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft py-[3px] pl-2 pr-2.5 font-semibold text-accent-soft-foreground">
        <ChatBubbleLeftIcon
          aria-hidden="true"
          className="size-3.5"
          strokeWidth={1.8}
        />
        {total}
      </span>
      {needsReply && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft py-[3px] pl-2 pr-2.5 font-semibold text-warning-soft-foreground">
          <span
            aria-hidden="true"
            className="size-[7px] rounded-full bg-gold-500"
          />
          {reply}
        </span>
      )}
    </span>
  );
}
