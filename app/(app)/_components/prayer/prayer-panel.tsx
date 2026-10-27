import type {
  ReportSectionKey,
  ReportSharedEntry,
} from "@/api/small-groups-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { ReactNode } from "react";

import { getLocale } from "next-intl/server";

import { getSectionConversation } from "@/api/conversations-api/client";
import { getSmallGroupReport } from "@/api/small-groups-api/client";
import { ConversationPanel } from "@/app/(app)/groups/reports/_components/conversation-panel";
import { getEnv } from "@/lib/env/server";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";
import { sectionPlainLines } from "@/lib/report-sections";

/**
 * The conversation panel for `?report=&section=`, opened over this page (rule 15): the same panel
 * as Report detail plus *View full report*. Null for a stale link: no thread and no text to start
 * one on, or a read that failed.
 */
export async function prayerPanel({
  entry,
  section,
  linked,
  closeHref,
}: {
  /** The week's entry for `?report=`. */
  entry: ReportSharedEntry;
  section: ReportSectionKey;
  linked: boolean;
  closeHref: string;
}): Promise<ReactNode> {
  const [thread, report, locale] = await Promise.all([
    getSectionConversation(entry.reportId, section).catch(() => undefined),
    // For who submitted it and the leaders' roles, as Report detail words them.
    getSmallGroupReport(String(entry.reportId)).catch(() => undefined),
    getLocale(),
  ]);
  const text = sectionPlainLines(entry.sections[section]).join("\n");

  if (thread === undefined || report === undefined || (!text && !thread)) {
    return null;
  }

  return (
    <ConversationPanel
      key={`${entry.reportId}:${section}`}
      anchor={{ type: "section", key: section, text }}
      closeHref={closeHref}
      groupName={entry.smallGroup.name}
      initialThread={thread}
      linked={linked}
      meetingDate={formatCalendarShortWeekdayDate(
        entry.meetingDate,
        locale as Locale,
      )}
      reportId={entry.reportId}
      returnFocusSelector={`[data-conversation-report="${entry.reportId}"][data-conversation-section="${section}"]`}
      roleByMember={Object.fromEntries(
        report.attendances
          .filter((a) => a.person.type === "member" && a.role !== "member")
          .map((a) => [a.person.id, a.role as "leader" | "co_leader"]),
      )}
      submittedBy={report.submittedBy.name}
      timeZone={getEnv().CHURCH_TIMEZONE}
      viewFullReportHref={`/groups/reports/${entry.reportId}?section=${section}`}
    />
  );
}
