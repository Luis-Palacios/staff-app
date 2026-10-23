import type { Person, ReportRosterPerson } from "@/api/small-groups-api/types";

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

/** The key a person's answers are stored under: a member and a guest can share an id. */
export function personKey(person: Pick<Person, "type" | "id">): string {
  return `${person.type}:${person.id}`;
}

/** Guests first, then leaders and members, each in the API's order. Member groups stay as they are. */
export function guestsFirst<T extends { person: Person }>(people: T[]): T[] {
  return [
    ...people.filter((row) => row.person.type === "guest"),
    ...people.filter((row) => row.person.type !== "guest"),
  ];
}
