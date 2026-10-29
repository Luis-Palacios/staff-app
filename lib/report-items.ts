import type { Person, ReportSegment } from "@/api/small-groups-api/types";

/** The key a person is known by within a report: a member and a guest can share an id. */
export type PersonKey = `${Person["type"]}:${number}`;

export function toPersonKey(person: Pick<Person, "type" | "id">): PersonKey {
  return `${person.type}:${person.id}`;
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * An item as plain text: tagged people as their first name (WhatsApp, rule 17) or their full name
 * (search, rule 16). No `@`. With `shortNames`, "first" is the short name (*Luis Palacios M.*), from `shortNames` or else `shortNameOf`.
 */
export function segmentsToPlain(
  segments: readonly ReportSegment[],
  {
    names,
    shortNames: short,
  }: {
    names: "first" | "full";
    shortNames?: ReadonlyMap<PersonKey, string>;
  },
): string {
  return segments
    .map((segment) => {
      if (segment.type === "text") return segment.text;

      if (names === "full") return segment.person.name;

      return (
        short?.get(toPersonKey(segment.person)) ??
        shortNameOf(segment.person.name)
      );
    })
    .join("");
}

/**
 * The name a chip shows (rule 11): the first two words and the initial of the third (*Luis Palacios M.*).
 * Names are one free-text field, so no word is judged to be a given name or a surname; a one-word
 * name stays as it is.
 */
export function shortNameOf(name: string): string {
  const [first, second, third] = name.trim().split(/\s+/);

  if (!first) return name;

  const initial = third ? `${Array.from(third)[0].toUpperCase()}.` : "";

  return [first, second, initial].filter(Boolean).join(" ");
}

/** The chip label of every person tagged in the given items (rule 11). */
export function shortNames(
  items: Iterable<{
    segments: readonly (
      | { type: "text"; text: string }
      | { type: "person"; person: Pick<Person, "type" | "id" | "name"> }
    )[];
  }>,
): Map<PersonKey, string> {
  const names = new Map<PersonKey, string>();

  for (const item of items) {
    for (const segment of item.segments) {
      if (segment.type === "person") {
        names.set(
          toPersonKey(segment.person),
          shortNameOf(segment.person.name),
        );
      }
    }
  }

  return names;
}

/**
 * One item per line, leading list markers dropped, blanks skipped (rule 2). The API does the same
 * for the old text fields; the browser does it for pasted text and for drafts saved as strings.
 */
export function splitLegacyText(text: string): string[] {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) =>
      line
        .replace(/^\s*(?:(?:[-*]|\d+[.)])\s+|[–•·]\s*)/u, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/** The API's limits (rule 3). An item's length counts a tagged person as its `@{member:198}` token. */
export const ITEMS_MAX = 20;
export const ITEM_MAX = 1024;
export const TAGS_MAX = 10;

type SegmentLike =
  | { type: "text"; text: string }
  | { type: "person"; person: Pick<Person, "type" | "id"> };

/** Characters the API counts against {@link ITEM_MAX}. */
export function segmentsLength(segments: readonly SegmentLike[]): number {
  return segments.reduce(
    (total, segment) =>
      total +
      (segment.type === "text"
        ? segment.text.length
        : `@{${segment.person.type}:${segment.person.id}}`.length),
    0,
  );
}

/** Editor positions the segments take: a character each, a chip as one atom. */
export function segmentsSize(segments: readonly SegmentLike[]): number {
  return segments.reduce(
    (total, segment) =>
      total + (segment.type === "text" ? segment.text.length : 1),
    0,
  );
}
