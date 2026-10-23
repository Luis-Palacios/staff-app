import type {
  ReportSectionKey,
  ReportSharedEntry,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { FlagIcon, HeartIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";

import { CopyForWhatsApp } from "./copy-for-whatsapp";
import { PrayerEntry } from "./prayer-entry";
import { whatsappAllText } from "./whatsapp-text";

import { card, title } from "@/components/primitives";
import {
  formatCalendarRange,
  formatCalendarShortWeekdayDate,
} from "@/lib/format-date";

// Follow-up asks for action, so it gets the warning tone; only on the tile and the pill, never
// the text.
const SECTIONS = {
  prayer: {
    icon: HeartIcon,
    tone: "bg-accent-soft text-accent-soft-foreground",
    title: "prayerTitle",
    sub: "prayerSub",
    subLeader: "prayerSubLeader",
    emptyThis: "emptyPrayerThis",
    emptyPast: "emptyPrayerPast",
    copy: "one-and-all",
  },
  praise: {
    icon: SparklesIcon,
    tone: "bg-success-soft text-success-soft-foreground",
    title: "praiseTitle",
    sub: "praiseSub",
    subLeader: "praiseSub",
    emptyThis: "emptyPraiseThis",
    emptyPast: "emptyPraisePast",
    copy: "one",
  },
  followUp: {
    icon: FlagIcon,
    tone: "bg-warning-soft text-warning-soft-foreground",
    title: "followUpTitle",
    sub: "followUpSub",
    subLeader: "followUpSubLeader",
    emptyThis: "emptyFollowUpThis",
    emptyPast: "emptyFollowUpPast",
    // Internal pastoral items: never copied (rule 12).
    copy: "none",
  },
} as const satisfies Record<ReportSectionKey, unknown>;

/** The entries of `section` that have its text, in the API's order (rules 7–8). */
export function sectionEntries(
  entries: ReportSharedEntry[],
  section: ReportSectionKey,
): { entry: ReportSharedEntry; text: string }[] {
  return entries.flatMap((entry) => {
    const text = entry[section];

    return text ? [{ entry, text }] : [];
  });
}

/** One of the three cards: icon tile, title with its count, a line on what it holds, the entries. */
export function PrayerSection({
  section,
  entries,
  weekStart,
  weekEnd,
  isCurrentWeek,
  scoped,
}: {
  section: ReportSectionKey;
  entries: { entry: ReportSharedEntry; text: string }[];
  /** The week, for *Copy all*'s title. */
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  /** A leader's view: the description speaks of "your groups". */
  scoped: boolean;
}) {
  const t = useTranslations("PrayerDashboard");
  const config = SECTIONS[section];
  const Icon = config.icon;
  const locale = useLocale() as Locale;
  const headingId = `prayer-section-${section}`;
  const sectionTitle = t(config.title);
  const copyTitle = config.copy === "none" ? undefined : sectionTitle;
  const copyAll = config.copy === "one-and-all" && entries.length >= 2;

  return (
    <section
      aria-labelledby={headingId}
      className={card({ className: "overflow-hidden" })}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 pb-4 pt-5 md:px-[22px]">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-[11px] ${config.tone}`}
          >
            <Icon aria-hidden="true" className="size-5" strokeWidth={1.7} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2
              className={title({
                size: "sm",
                className: "flex flex-wrap items-center gap-2.5 text-[23px]",
              })}
              id={headingId}
            >
              {sectionTitle}
              <span
                className={`rounded-full px-[9px] py-0.5 font-sans text-[13px] font-semibold tracking-normal ${config.tone}`}
              >
                {t("groupCount", { n: entries.length })}
              </span>
            </h2>
            <p className="text-[13.5px] text-muted">
              {t(scoped ? config.subLeader : config.sub)}
            </p>
          </div>
        </div>
        {copyAll && (
          <CopyForWhatsApp
            copied={t("copiedAll")}
            failed={t("copyFailed")}
            label={t("copyAll")}
            note={t("copiedNote")}
            text={whatsappAllText(
              sectionTitle,
              formatCalendarRange(weekStart, weekEnd, locale),
              entries.map(({ entry, text }) => ({
                group: entry.smallGroup.name,
                date: formatCalendarShortWeekdayDate(entry.meetingDate, locale),
                text,
              })),
            )}
          />
        )}
      </div>

      {entries.length === 0 ? (
        <p className="border-t border-separator px-4 pb-[22px] pt-4 text-sm italic text-muted md:px-[22px]">
          {t(isCurrentWeek ? config.emptyThis : config.emptyPast)}
        </p>
      ) : (
        <ul>
          {entries.map(({ entry, text }) => (
            <PrayerEntry
              key={entry.reportId}
              copyTitle={copyTitle}
              entry={entry}
              text={text}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
