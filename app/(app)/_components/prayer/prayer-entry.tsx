import type {
  ReportSectionKey,
  ReportSharedEntry,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import clsx from "clsx";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { CopyForWhatsApp } from "./copy-for-whatsapp";
import { SectionConversationLink } from "./section-conversation-link";
import { whatsappEntryText } from "./whatsapp-text";

import { textLink } from "@/components/primitives";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";

/**
 * One group's text in a section: the group block (name, leaders, meeting date) on the left, the
 * text and its actions on the right. They stack when the card is narrow (a phone, or a tablet with
 * the conversation panel open): a container query on the section, not the viewport.
 */
export function PrayerEntry({
  entry,
  section,
  sectionTitle,
  text,
  copyTitle,
  conversationHref,
  focused,
}: {
  entry: ReportSharedEntry;
  section: ReportSectionKey;
  sectionTitle: string;
  /** This section's text of the entry, never empty. */
  text: string;
  /** The section title for *Copy for WhatsApp*; none on follow-up, which is never copied. */
  copyTitle?: string;
  /** Opens this entry's section thread on the page; none outside the conversations' audience. */
  conversationHref?: string;
  /** Its panel is open: the gold edge. */
  focused: boolean;
}) {
  const t = useTranslations("PrayerDashboard");
  const tConv = useTranslations("Conversations");
  const conversation = entry.conversations[section];
  const group = entry.smallGroup.name;
  const locale = useLocale() as Locale;
  const date = formatCalendarShortWeekdayDate(entry.meetingDate, locale);

  return (
    <li
      className={clsx(
        "flex flex-col gap-x-7 gap-y-2.5 border-t border-separator p-4 md:px-[22px] md:py-[18px] @2xl:flex-row",
        focused && "bg-focus-row shadow-[inset_3px_0_0_var(--color-gold-500)]",
      )}
    >
      <div className="flex flex-col gap-[3px] @2xl:w-60 @2xl:shrink-0">
        <span className="text-[15px] font-semibold text-heading">
          {entry.smallGroup.name}
        </span>
        {entry.leaders.length > 0 && (
          <span className="text-[13px] text-muted">
            {entry.leaders.map((leader) => leader.name).join(" · ")}
          </span>
        )}
        <span className="text-[13px] tabular-nums text-muted">{date}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="max-w-[72ch] whitespace-pre-line text-[15.5px] leading-[1.6] text-foreground">
          {text}
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          {copyTitle && (
            <CopyForWhatsApp
              ariaLabel={t("copyAria", { group: entry.smallGroup.name })}
              copied={t("copied")}
              failed={t("copyFailed")}
              label={t("copy")}
              note={t("copiedNote")}
              text={whatsappEntryText(copyTitle, {
                group: entry.smallGroup.name,
                date,
                text,
              })}
            />
          )}
          {conversationHref && (
            <SectionConversationLink
              ariaLabel={
                conversation
                  ? t("conversationAria", {
                      section: sectionTitle,
                      group,
                      n: conversation.commentCount,
                      state:
                        conversation.status === "resolved"
                          ? tConv("statusResolved")
                          : conversation.needsMyReply
                            ? tConv("statusReply")
                            : tConv("statusOpen"),
                    })
                  : t("startAria", { section: sectionTitle, group })
              }
              conversation={conversation}
              href={conversationHref}
              label={
                conversation
                  ? t("commentCount", { n: conversation.commentCount })
                  : t("startConversation")
              }
              reportId={entry.reportId}
              section={section}
            />
          )}
          <NextLink
            aria-label={t("viewReportAria", {
              group: entry.smallGroup.name,
              date,
            })}
            className={textLink({
              className:
                "inline-flex min-h-11 items-center px-1.5 text-[13.5px] md:min-h-10",
            })}
            href={`/groups/reports/${entry.reportId}`}
          >
            {t("viewReport")}
          </NextLink>
        </div>
      </div>
    </li>
  );
}
