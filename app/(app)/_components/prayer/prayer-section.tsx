import type { ReportSectionKey } from "@/api/small-groups-api/types";
import type { ReactNode } from "react";
import type { WhatsAppEntry } from "./whatsapp-text";

import { Fragment } from "react";

import { CopyForWhatsApp } from "./copy-for-whatsapp";
import { whatsappAllText } from "./whatsapp-text";

import { card, title } from "@/components/primitives";
import {
  REPORT_SECTION_TONES,
  ReportSectionTile,
} from "@/components/report-section-tile";

export interface PrayerSectionEntryView {
  reportId: number;
  /** Normalized group and leader names for client-side search. */
  searchText: string;
  whatsApp: WhatsAppEntry;
  node: ReactNode;
}

export interface PrayerSectionView {
  section: ReportSectionKey;
  title: string;
  subtitle: string;
  emptyText: string;
  /** Formatted group counts for 0..entries.length ("0 groups", "1 group", …). */
  groupCounts: string[];
  /** Present on sections that support *Copy all for WhatsApp* (Prayer requests). */
  copyAll?: {
    weekRange: string;
    label: string;
    copied: string;
    note: string;
    failed: string;
  };
  entries: PrayerSectionEntryView[];
}

/** One of the three cards: icon tile, title with its count, a line on what it holds, the entries. */
export function PrayerSection({
  view,
  normalizedQuery,
  noMatches,
}: {
  view: PrayerSectionView;
  normalizedQuery: string;
  noMatches: string;
}) {
  const { section, entries } = view;
  const headingId = `prayer-section-${section}`;
  const visible = normalizedQuery
    ? entries.filter((item) => item.searchText.includes(normalizedQuery))
    : entries;
  const copyAll = view.copyAll && visible.length >= 2 ? view.copyAll : null;

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
              {view.title}
              <span
                className={`rounded-full px-[9px] py-0.5 font-sans text-[13px] font-semibold tracking-normal ${REPORT_SECTION_TONES[section]}`}
              >
                {view.groupCounts[visible.length]}
              </span>
            </h2>
            <p className="text-[13.5px] text-muted">{view.subtitle}</p>
          </div>
        </div>
        {copyAll && (
          <CopyForWhatsApp
            copied={copyAll.copied}
            failed={copyAll.failed}
            label={copyAll.label}
            note={copyAll.note}
            text={whatsappAllText(
              view.title,
              copyAll.weekRange,
              visible.map((item) => item.whatsApp),
            )}
          />
        )}
      </div>

      {visible.length === 0 ? (
        <p className="border-t border-separator px-4 pb-[22px] pt-4 text-sm italic text-muted md:px-[22px]">
          {normalizedQuery ? noMatches : view.emptyText}
        </p>
      ) : (
        <ul>
          {visible.map((item) => (
            <Fragment key={item.reportId}>{item.node}</Fragment>
          ))}
        </ul>
      )}
    </section>
  );
}
