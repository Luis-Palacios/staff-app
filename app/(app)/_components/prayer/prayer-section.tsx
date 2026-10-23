import type {
  ReportSectionKey,
  ReportSharedEntry,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { CopyForWhatsApp } from "./copy-for-whatsapp";
import { PrayerEntry } from "./prayer-entry";
import { whatsappAllText } from "./whatsapp-text";

import { card, title } from "@/components/primitives";
import {
  REPORT_SECTION_TONES,
  ReportSectionTile,
} from "@/components/report-section-tile";
import {
  formatCalendarRange,
  formatCalendarShortWeekdayDate,
} from "@/lib/format-date";

const SECTIONS = {
  prayer: {
    title: "prayerTitle",
    sub: "prayerSub",
    subLeader: "prayerSubLeader",
    emptyThis: "emptyPrayerThis",
    emptyPast: "emptyPrayerPast",
    copy: "one-and-all",
  },
  praise: {
    title: "praiseTitle",
    sub: "praiseSub",
    subLeader: "praiseSub",
    emptyThis: "emptyPraiseThis",
    emptyPast: "emptyPraisePast",
    copy: "one",
  },
  followUp: {
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
  conversationHref,
  activeReportId,
}: {
  section: ReportSectionKey;
  entries: { entry: ReportSharedEntry; text: string }[];
  /** The week, for *Copy all*'s title. */
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  /** A leader's view: the description speaks of "your groups". */
  scoped: boolean;
  /** The link that opens an entry's thread here, or none when the caller can't see it. */
  conversationHref: (entry: ReportSharedEntry) => string | undefined;
  /** The report whose panel is open on this section, if any. */
  activeReportId?: number;
}) {
  const t = useTranslations("PrayerDashboard");
  const config = SECTIONS[section];
  const locale = useLocale() as Locale;
  const headingId = `prayer-section-${section}`;
  const sectionTitle = t(config.title);
  const copyTitle = config.copy === "none" ? undefined : sectionTitle;
  const copyAll = config.copy === "one-and-all" && entries.length >= 2;

  return (
    <section
      aria-labelledby={headingId}
      className={card({ className: "@container overflow-hidden" })}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 pb-4 pt-5 md:px-[22px]">
        <div className="flex min-w-0 items-center gap-3.5">
          <ReportSectionTile
            className="size-10 rounded-[11px]"
            iconClassName="size-5"
            section={section}
          />
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
                className={`rounded-full px-[9px] py-0.5 font-sans text-[13px] font-semibold tracking-normal ${REPORT_SECTION_TONES[section]}`}
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
              conversationHref={conversationHref(entry)}
              copyTitle={copyTitle}
              entry={entry}
              focused={entry.reportId === activeReportId}
              section={section}
              sectionTitle={sectionTitle}
              text={text}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
