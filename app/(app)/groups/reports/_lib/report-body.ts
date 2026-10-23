import type { ReportInput, ReportRoster } from "@/api/small-groups-api/types";
import type { ReportDraft } from "./report-draft";

import { personKey } from "./person";

/**
 * The API body for a complete draft, people in roster order (rule 3); null while anyone is
 * unanswered. `includeObservations` false (rule 9: the caller can't see them) leaves the field out
 * of every row, so the API keeps what it has instead of clearing it.
 */
export function toReportInput(
  draft: ReportDraft,
  roster: ReportRoster,
  date: string,
  includeObservations: boolean,
): ReportInput | null {
  const attendances: ReportInput["attendances"] = [];

  for (const person of roster.people) {
    const answer = draft.answers[personKey(person.person)];

    if (
      !answer ||
      answer.attendedGroup === null ||
      answer.attendedChurch === null
    ) {
      return null;
    }

    attendances.push({
      ...(person.person.type === "guest"
        ? { guestId: person.person.id }
        : { memberId: person.person.id }),
      attendedGroup: answer.attendedGroup,
      attendedChurch: answer.attendedChurch,
      ...(includeObservations && {
        observation: answer.observation.trim() || null,
      }),
    });
  }

  return {
    meetingDate: date,
    address: draft.address.trim() || null,
    groupPrayerRequest: draft.prayer.trim() || null,
    groupPraiseReport: draft.praise.trim() || null,
    groupRelevantDiscussion: draft.discussion.trim() || null,
    attendances,
  };
}
