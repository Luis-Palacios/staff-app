import type { ConversationInboxItem } from "@/api/conversations-api/types";
import type { Locale } from "@/lib/locale-shared";

import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import {
  conversationHref,
  excerptText,
  formatActivity,
} from "@/lib/conversation-format";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";
import { GuestsBadge } from "@/components/guests-badge";
import { initialsOf } from "@/components/initials-avatar";
import { ReportSectionTile } from "@/components/report-section-tile";
import { StatusBadge } from "@/components/status-badge";

// One conversation in the inbox (and, compact, in the dashboard block). A single link to the report
// with the person's panel open. No hooks of its own, so a server page and the client "Show more"
// list both render it.
export function ConversationRow({
  item,
  guests,
  timeZone,
  compact = false,
}: {
  item: ConversationInboxItem;
  /** The row's group is a guest group (rule 19). */
  guests: boolean;
  timeZone: string;
  /** The dashboard block: no status pill, no comment count, a one-line excerpt. */
  compact?: boolean;
}) {
  const t = useTranslations("Conversations");
  const locale = useLocale();
  const resolved = item.status === "resolved";
  const { lastComment, anchor } = item;
  // A section thread shows the section's title where a person's name goes (rule 17).
  const name =
    anchor.type === "section"
      ? t("sectionTitle", { section: anchor.key })
      : (item.person?.name ?? "");
  const unreadDot = item.unread && (
    <span className="absolute -right-0.5 -top-0.5 size-[11px] rounded-full border-2 border-surface bg-gold-500" />
  );
  const who = lastComment.mine ? t("you") : `${lastComment.authorName}:`;
  const excerpt =
    lastComment.deleted || lastComment.excerpt === null
      ? t("deletedShort")
      : `${who} ${excerptText(lastComment.excerpt)}`;
  const status = resolved
    ? { tone: "success" as const, label: t("statusResolved") }
    : item.needsMyReply
      ? { tone: "warning" as const, label: t("statusReply") }
      : { tone: "accent" as const, label: t("statusOpen") };

  return (
    <NextLink
      className={clsx(
        "flex items-start gap-3.5 px-[18px] py-4 hover:bg-surface-secondary sm:px-[22px]",
        item.unread && "bg-focus-row hover:bg-focus-row",
      )}
      href={conversationHref(item)}
    >
      {anchor.type === "section" ? (
        <span aria-hidden="true" className="relative shrink-0">
          <ReportSectionTile
            className="size-10 rounded-xl"
            iconClassName="size-5"
            section={anchor.key}
          />
          {unreadDot}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-bold text-accent-soft-foreground"
        >
          {initialsOf(name)}
          {unreadDot}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            className={clsx(
              "text-[15px] text-heading",
              item.unread ? "font-bold" : "font-semibold",
            )}
          >
            {name}
          </span>
          {!compact && (
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span>
            {item.group.name}
            {" · "}
            {t("reportFor", {
              date: formatCalendarShortWeekdayDate(
                item.report.meetingDate,
                locale as Locale,
              ),
            })}
          </span>
          {guests && <GuestsBadge />}
          {item.group.closed && (
            <StatusBadge tone="neutral" variant="ring-dot">
              {t("closed")}
            </StatusBadge>
          )}
        </span>
        <span
          className={clsx(
            "text-sm leading-snug text-foreground",
            compact ? "line-clamp-1" : "line-clamp-2",
          )}
        >
          {resolved && item.resolvedBy && !compact && (
            <span className="font-semibold">
              {t("resolvedLine", { name: item.resolvedBy.name })}{" "}
            </span>
          )}
          {excerpt}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1 text-[12.5px] text-muted">
        <span className="whitespace-nowrap">
          {formatActivity(lastComment.createdAt, locale, timeZone)}
        </span>
        {!compact && (
          <span className="whitespace-nowrap tabular-nums">
            {t("commentsShort", { count: item.commentCount })}
          </span>
        )}
      </span>
    </NextLink>
  );
}
