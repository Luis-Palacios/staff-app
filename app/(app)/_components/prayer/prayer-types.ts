import type { ReportSectionKey } from "@/api/small-groups-api/types";
import type { ReactNode } from "react";
import type { WhatsAppEntry } from "./whatsapp-text";

export interface PrayerSectionEntryView {
  reportId: number;
  /** Normalized group and leader names, one per line, for client-side search. */
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
  /** The report whose conversation panel is open on this section, if any. */
  activeReportId?: number;
  /** Present on sections that support *Copy all for WhatsApp* (Prayer requests). */
  copyAll?: {
    weekRange: string;
    label: string;
    /** The label while a search narrows the list. */
    matchingLabel: string;
    copied: string;
    note: string;
    failed: string;
  };
  entries: PrayerSectionEntryView[];
}

/**
 * The entries that match a normalized search: every word must appear in the group or leader names.
 * The entry whose panel is open stays, so the panel never points at a row that isn't there.
 */
export function filterPrayerEntries(
  view: PrayerSectionView,
  normalizedQuery: string,
): PrayerSectionEntryView[] {
  if (!normalizedQuery) return view.entries;

  const words = normalizedQuery.split(/\s+/);

  return view.entries.filter(
    (item) =>
      item.reportId === view.activeReportId ||
      words.every((word) => item.searchText.includes(word)),
  );
}
