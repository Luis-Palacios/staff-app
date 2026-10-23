import type {
  ReportSectionKey,
  ReportSharedEntry,
} from "@/api/small-groups-api/types";

import { FlagIcon, HeartIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { PrayerEntry } from "./prayer-entry";

import { card, title } from "@/components/primitives";

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
  },
  praise: {
    icon: SparklesIcon,
    tone: "bg-success-soft text-success-soft-foreground",
    title: "praiseTitle",
    sub: "praiseSub",
    subLeader: "praiseSub",
    emptyThis: "emptyPraiseThis",
    emptyPast: "emptyPraisePast",
  },
  followUp: {
    icon: FlagIcon,
    tone: "bg-warning-soft text-warning-soft-foreground",
    title: "followUpTitle",
    sub: "followUpSub",
    subLeader: "followUpSubLeader",
    emptyThis: "emptyFollowUpThis",
    emptyPast: "emptyFollowUpPast",
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
  isCurrentWeek,
  scoped,
}: {
  section: ReportSectionKey;
  entries: { entry: ReportSharedEntry; text: string }[];
  isCurrentWeek: boolean;
  /** A leader's view: the description speaks of "your groups". */
  scoped: boolean;
}) {
  const t = useTranslations("PrayerDashboard");
  const config = SECTIONS[section];
  const Icon = config.icon;
  const headingId = `prayer-section-${section}`;

  return (
    <section
      aria-labelledby={headingId}
      className={card({ className: "overflow-hidden" })}
    >
      <div className="flex items-center gap-3.5 px-4 pb-4 pt-5 md:px-[22px]">
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
            {t(config.title)}
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

      {entries.length === 0 ? (
        <p className="border-t border-separator px-4 pb-[22px] pt-4 text-sm italic text-muted md:px-[22px]">
          {t(isCurrentWeek ? config.emptyThis : config.emptyPast)}
        </p>
      ) : (
        <ul>
          {entries.map(({ entry, text }) => (
            <PrayerEntry key={entry.reportId} entry={entry} text={text} />
          ))}
        </ul>
      )}
    </section>
  );
}
