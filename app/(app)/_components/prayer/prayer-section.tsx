"use client";

import type { PrayerSectionView } from "./prayer-types";

import { Fragment } from "react";

import { CopyForWhatsApp } from "./copy-for-whatsapp";
import { filterPrayerEntries } from "./prayer-types";
import { whatsappAllText } from "./whatsapp-text";

import { card, title } from "@/components/primitives";
import {
  REPORT_SECTION_TONES,
  ReportSectionTile,
} from "@/components/report-section-tile";

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
  const visible = filterPrayerEntries(view, normalizedQuery);
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
            label={normalizedQuery ? copyAll.matchingLabel : copyAll.label}
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
          {entries.length > 0 ? noMatches : view.emptyText}
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
