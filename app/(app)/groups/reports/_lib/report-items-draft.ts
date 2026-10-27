import type {
  Person,
  ReportItemInput,
  ReportSectionKey,
} from "@/api/small-groups-api/types";

import { splitLegacyText } from "@/lib/report-items";

/**
 * An item as the form holds it. A tagged person keeps the full name, so the chip renders before any
 * request (the API sends the current name back on every read).
 */
export type DraftSegment =
  | { type: "text"; text: string }
  | { type: "person"; person: Person };

export interface DraftItem {
  /** Identity for React and focus only; never sent. */
  key: string;
  segments: DraftSegment[];
}

export type DraftItems = Record<ReportSectionKey, DraftItem[]>;

let counter = 0;

export function newItemKey(): string {
  counter += 1;

  return `item-${Date.now().toString(36)}-${counter}`;
}

export function newDraftItem(segments: DraftSegment[] = []): DraftItem {
  return { key: newItemKey(), segments: mergeText(segments) };
}

/** A section always shows at least one (empty) item to type in. */
export function emptyDraftItems(): DraftItems {
  return {
    prayer: [newDraftItem()],
    praise: [newDraftItem()],
    followUp: [newDraftItem()],
  };
}

/** Adjacent text segments joined, empty ones dropped. */
export function mergeText(segments: readonly DraftSegment[]): DraftSegment[] {
  const merged: DraftSegment[] = [];

  for (const segment of segments) {
    if (segment.type === "text") {
      if (!segment.text) continue;

      const last = merged[merged.length - 1];

      if (last?.type === "text") {
        merged[merged.length - 1] = {
          type: "text",
          text: last.text + segment.text,
        };
        continue;
      }
    }

    merged.push(segment);
  }

  return merged;
}

/** Blank after trimming and nobody tagged: the API would drop it, so the form does too. */
export function isEmptyItem(item: Pick<DraftItem, "segments">): boolean {
  return item.segments.every(
    (segment) => segment.type === "text" && !segment.text.trim(),
  );
}

/** Text becomes one item per line (rule 2): older drafts, and pasted text. */
export function itemsFromText(text: string): DraftItem[] {
  return splitLegacyText(text).map((line) =>
    newDraftItem([{ type: "text", text: line }]),
  );
}

/** The API's item: whitespace collapsed, ends trimmed, people as ids only. */
export function toItemInput(item: DraftItem): ReportItemInput {
  const segments = mergeText(item.segments).map((segment) =>
    segment.type === "text"
      ? { type: "text" as const, text: segment.text.replace(/\s+/g, " ") }
      : {
          type: "person" as const,
          person: { type: segment.person.type, id: segment.person.id },
        },
  );
  const first = segments[0];
  const last = segments[segments.length - 1];

  if (first?.type === "text") first.text = first.text.trimStart();
  if (last?.type === "text") last.text = last.text.trimEnd();

  return { segments: segments.filter((s) => s.type !== "text" || s.text) };
}
