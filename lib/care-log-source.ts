import type { CareLogPerson } from "@/components/care/care-log-form";
import type { ReportItem } from "@/api/small-groups-api/types";

const MAX_PEOPLE = 10;

/**
 * The people tagged in a section's items, each once, in order: who *Log care* starts with. Only
 * people the viewer can open (`viewable`, so in their scope): a tag doesn't say whether the person
 * is still active, so an inactive one that slips through is the API's 422 `people`, which the form
 * words as "remove them and try again".
 */
export function taggedPeople(items: readonly ReportItem[]): CareLogPerson[] {
  const seen = new Set<string>();
  const people: CareLogPerson[] = [];

  for (const item of items) {
    for (const segment of item.segments) {
      if (segment.type !== "person" || !segment.person.viewable) continue;

      const { type, id, name } = segment.person;
      const key = `${type}:${id}`;

      if (seen.has(key)) continue;

      seen.add(key);
      people.push({ type, id, name });
    }
  }

  return people.slice(0, MAX_PEOPLE);
}
