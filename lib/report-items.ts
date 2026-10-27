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
 * (search, rule 16). No `@`.
 */
export function segmentsToPlain(
  segments: readonly ReportSegment[],
  { names }: { names: "first" | "full" },
): string {
  return segments
    .map((segment) => {
      if (segment.type === "text") return segment.text;

      return names === "first"
        ? firstNameOf(segment.person.name)
        : segment.person.name;
    })
    .join("");
}

/**
 * The name a chip shows (rule 11): the first name, plus the last initial (*Pablo S.*) when two
 * different people tagged in the same report share a first name. Pass every item of the report.
 */
export function shortNames(
  items: Iterable<{
    segments: readonly (
      | { type: "text"; text: string }
      | { type: "person"; person: Pick<Person, "type" | "id" | "name"> }
    )[];
  }>,
): Map<PersonKey, string> {
  const people = new Map<PersonKey, string>();

  for (const item of items) {
    for (const segment of item.segments) {
      if (segment.type === "person") {
        people.set(toPersonKey(segment.person), segment.person.name);
      }
    }
  }

  const firstNameCount = new Map<string, number>();

  for (const name of people.values()) {
    const key = firstNameOf(name).toLowerCase();

    firstNameCount.set(key, (firstNameCount.get(key) ?? 0) + 1);
  }

  return new Map(
    [...people].map(([key, name]) => {
      const first = firstNameOf(name);
      const words = name.trim().split(/\s+/);
      const last = words.length > 1 ? words[words.length - 1] : "";
      const initial = last ? Array.from(last)[0] : "";
      const shared = (firstNameCount.get(first.toLowerCase()) ?? 0) > 1;

      return [key, shared && initial ? `${first} ${initial}.` : first];
    }),
  );
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
