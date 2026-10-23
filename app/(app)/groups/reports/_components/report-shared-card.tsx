import type { ReportConversations } from "@/api/conversations-api/types";
import type {
  ReportDetail,
  ReportSectionKey,
} from "@/api/small-groups-api/types";

import {
  ChatBubbleLeftRightIcon,
  HeartIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { getTranslations } from "next-intl/server";

import { ConversationIndicator } from "./conversation-indicator";

import { card, testimony, title } from "@/components/primitives";
import { reportSectionText } from "@/lib/report-sections";

const SECTIONS = [
  { key: "prayer", icon: HeartIcon, label: "prayer" },
  { key: "praise", icon: SparklesIcon, label: "praise" },
  { key: "followUp", icon: ChatBubbleLeftRightIcon, label: "discussion" },
] as const satisfies readonly {
  key: ReportSectionKey;
  icon: unknown;
  label: string;
}[];

/**
 * What the group asked, thanked and left for the elders: three sections in the testimony style.
 * With `conversations` (the caller is in the audience), each section gets the conversation control
 * right of its title (prayer & follow-up rule 16). A section with no text and no thread shows none:
 * there is nothing to talk about (rule 14).
 */
export async function ReportSharedCard({
  report,
  conversations,
  activeSection,
}: {
  report: ReportDetail;
  conversations: ReportConversations | null;
  /** The section whose panel is open: the gold edge. */
  activeSection?: ReportSectionKey;
}) {
  const [t, tConv] = await Promise.all([
    getTranslations("ReportDetail"),
    getTranslations("Conversations"),
  ]);
  const summaryBySection = new Map(
    (conversations?.conversations ?? []).flatMap((summary) =>
      summary.anchor.type === "section"
        ? [[summary.anchor.key, summary] as const]
        : [],
    ),
  );

  return (
    <section className={card({ className: "mb-5 flex flex-col" })}>
      <header className="flex flex-col gap-1 px-6 pb-1.5 pt-5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-eyebrow">
          {t("fromGroup")}
        </p>
        <h2 className={title({ size: "sm" })}>{t("sharedTitle")}</h2>
      </header>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] pb-3 pt-2">
        {SECTIONS.map(({ key, icon: Icon, label }) => {
          const text = reportSectionText(report, key);
          const summary = summaryBySection.get(key);
          const about = tConv("sectionAbout", { section: key });
          const state = summary
            ? summary.status === "resolved"
              ? tConv("statusResolved")
              : summary.needsMyReply
                ? tConv("statusReply")
                : tConv("statusOpen")
            : "";

          return (
            <div
              key={key}
              className={clsx(
                "flex flex-col gap-2.5 border-t border-separator px-6 pb-4 pt-3.5",
                key === activeSection &&
                  "bg-focus-row shadow-[inset_3px_0_0_var(--color-gold-500)]",
              )}
            >
              <div className="flex min-h-10 items-center gap-2.5">
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent-soft-foreground">
                  <Icon
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.7}
                  />
                </span>
                <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-heading">
                  {t(label)}
                </h3>
                {conversations !== null && (text || summary) && (
                  <span className="-mr-2 shrink-0">
                    <ConversationIndicator
                      anchor={{ type: "section", key }}
                      labels={{
                        start: tConv("sectionStartAria", { about }),
                        row: summary
                          ? tConv("sectionRowAria", {
                              about,
                              count: summary.commentCount,
                              state,
                            })
                          : "",
                      }}
                      summary={summary}
                    />
                  </span>
                )}
              </div>
              {text ? (
                <p className={testimony({ className: "whitespace-pre-line" })}>
                  {text}
                </p>
              ) : (
                <p className="text-sm text-muted">{t("nothingShared")}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
