import type {
  Person,
  SmallGroupRole,
  TaggablePerson,
} from "@/api/small-groups-api/types";
import type { PersonKey } from "@/lib/report-items";

import { toPersonKey } from "@/lib/report-items";
import { normalizeText } from "@/lib/normalize-text";

/** Where someone stands on this report's attendance list (rule 8). */
export type MeetingState = "came" | "missed" | "notMarked";

export interface TagRosterPerson {
  person: Person;
  role: SmallGroupRole;
  state: MeetingState;
}

/** What the picker needs from the form: the group, and who is on this report. */
export interface TagContext {
  groupId: number;
  groupName: string;
  roster: TagRosterPerson[];
}

export interface TagOption {
  key: PersonKey;
  person: Person;
  /** Set for people on this report's roster. */
  roster?: TagRosterPerson;
  /** Set for church-wide results. */
  church?: TaggablePerson;
}

export type TagSectionId = "named" | "meeting" | "group" | "church";

export interface TagSection {
  id: TagSectionId;
  options: TagOption[];
}

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function wordsOf(text: string): string[] {
  return normalizeText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** The roster option for someone, in the picker's shape. */
function rosterOption(person: TagRosterPerson): TagOption {
  return {
    key: toPersonKey(person.person),
    person: person.person,
    roster: person,
  };
}

/**
 * What the picker lists from the roster, with no request (rule 8, rule 9). `button` with nothing
 * typed is the person button: *Named in this item* (people at the meeting whose first name is
 * already a word in the item, in order of appearance), then the rest of *At this meeting*.
 * Otherwise *At this meeting* (came) and the rest of the roster, filtered by every typed word.
 */
export function rosterSections({
  context,
  query,
  mode,
  itemText,
  tagged,
}: {
  context: TagContext;
  query: string;
  mode: "at" | "button";
  itemText: string;
  tagged: ReadonlySet<PersonKey>;
}): TagSection[] {
  const pool = context.roster.filter(
    (row) => !tagged.has(toPersonKey(row.person)),
  );
  const typed = wordsOf(query);

  if (typed.length === 0 && mode === "button") {
    const textWords = wordsOf(itemText);
    const at = pool.filter((row) => row.state === "came");
    const named = at
      .map((row) => ({
        row,
        index: textWords.indexOf(normalizeText(firstNameOf(row.person.name))),
      }))
      .filter(({ index }) => index >= 0)
      .sort((a, b) => a.index - b.index)
      .map(({ row }) => row);
    const rest = at.filter((row) => !named.includes(row));

    return [
      { id: "named" as const, options: named.map(rosterOption) },
      { id: "meeting" as const, options: rest.map(rosterOption) },
    ].filter((section) => section.options.length > 0);
  }

  const matches = pool.filter((row) => {
    const name = normalizeText(row.person.name);

    return typed.every((word) => name.includes(word));
  });

  return [
    {
      id: "meeting" as const,
      options: matches.filter((row) => row.state === "came").map(rosterOption),
    },
    {
      id: "group" as const,
      options: matches.filter((row) => row.state !== "came").map(rosterOption),
    },
  ].filter((section) => section.options.length > 0);
}

/** *Everyone else in the church*: search results without people already listed or tagged. */
export function churchSection(
  results: readonly TaggablePerson[],
  listed: ReadonlySet<PersonKey>,
): TagSection | null {
  const options = results
    .filter((row) => !listed.has(toPersonKey(row.person)))
    .map(
      (row): TagOption => ({
        key: toPersonKey(row.person),
        person: row.person,
        church: row,
      }),
    );

  return options.length > 0 ? { id: "church", options } : null;
}

/** Where the first plain occurrence of `person`'s first name sits in `text`, as a word (rule 9). */
export function findFirstNameWord(
  text: string,
  person: Pick<Person, "name">,
): { index: number; length: number } | null {
  const target = normalizeText(firstNameOf(person.name));

  if (!target) return null;

  const pattern = /[\p{L}\p{N}]+/gu;

  for (const match of text.matchAll(pattern)) {
    if (normalizeText(match[0]) === target) {
      return { index: match.index, length: match[0].length };
    }
  }

  return null;
}
