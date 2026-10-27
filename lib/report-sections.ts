import type {
  ReportItem,
  ReportSections,
  ReportSectionKey,
} from "@/api/small-groups-api/types";

import { segmentsToPlain } from "@/lib/report-items";

/** The report sections a conversation can be about, in the page's order. */
export const REPORT_SECTION_KEYS: readonly ReportSectionKey[] = [
  "prayer",
  "praise",
  "followUp",
];

/** A `?section=` value, or null for a missing or unknown one (ignored, like a bad `?person=`). */
export function parseSectionParam(
  value: string | string[] | undefined,
): ReportSectionKey | null {
  const raw = Array.isArray(value) ? value[0] : value;

  return REPORT_SECTION_KEYS.find((key) => key === raw) ?? null;
}

/** The report's items for `section`, in the order the leader wrote them. */
export function reportSectionItems(
  report: { sections: ReportSections },
  section: ReportSectionKey,
): ReportItem[] {
  return report.sections[section];
}

/** A section thread can start when the section has at least one item (rule 18). */
export function sectionHasItems(
  report: { sections: ReportSections },
  section: ReportSectionKey,
): boolean {
  return report.sections[section].length > 0;
}

/** The items as plain lines, tagged people by full name. */
export function sectionPlainLines(items: readonly ReportItem[]): string[] {
  return items.map((item) => segmentsToPlain(item.segments, { names: "full" }));
}
