import type {
  ReportDetail,
  ReportSectionKey,
} from "@/api/small-groups-api/types";

/** The report texts a conversation can be about, in the page's order. */
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

/** The report's text for `section` (the API's own field names), trimmed; null when empty. */
export function reportSectionText(
  report: Pick<
    ReportDetail,
    "groupPrayerRequest" | "groupPraiseReport" | "groupRelevantDiscussion"
  >,
  section: ReportSectionKey,
): string | null {
  const text = {
    prayer: report.groupPrayerRequest,
    praise: report.groupPraiseReport,
    followUp: report.groupRelevantDiscussion,
  }[section];

  return text?.trim() || null;
}
