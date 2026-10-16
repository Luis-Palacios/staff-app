import type { ReportRosterPerson } from "@/api/small-groups-api/types";

import { addDays } from "./meeting-dates";

/** The API sends one `name`; the questions use its first word ("Was Daniela at church…"). */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Someone who joined in the 30 days up to the meeting gets an "In the group since" hint. */
export function joinedRecently(
  person: Pick<ReportRosterPerson, "joinedAt">,
  meetingDate: string,
): boolean {
  return (
    person.joinedAt <= meetingDate &&
    person.joinedAt >= addDays(meetingDate, -30)
  );
}

/** "Missed the last N meetings" shows from 2 up (rule 11). */
export const MISSED_STREAK_MIN = 2;
