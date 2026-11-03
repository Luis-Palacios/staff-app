/**
 * Reports started before auto-save were kept only in the browser, under
 * `ekk-report-draft:{group}:{date}`. The first time the new-report screen opens that group and
 * date with no report there yet, the entry becomes a server draft once and is removed (auto-save
 * rule 21); a date that already has a report just loses the entry. Nothing else reads or writes
 * these keys any more.
 */

import type { ReportDraft } from "./report-form";

import {
  type DraftItem,
  type DraftItems,
  itemsFromText,
  newDraftItem,
} from "./report-items-draft";

function legacyKey(groupId: number | string, meetingDate: string) {
  return `ekk-report-draft:${groupId}:${meetingDate}`;
}

function isDraft(value: unknown): value is ReportDraft {
  if (typeof value !== "object" || value === null) return false;

  const draft = value as Record<string, unknown>;

  return (
    typeof draft.address === "string" &&
    typeof draft.answers === "object" &&
    draft.answers !== null
  );
}

function isDraftItem(value: unknown): value is DraftItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return typeof item.key === "string" && Array.isArray(item.segments);
}

/** A section always has an item to type in. */
function atLeastOne(items: DraftItem[]): DraftItem[] {
  return items.length > 0 ? items : [newDraftItem()];
}

/**
 * Drafts saved before items hold three strings: each becomes one item per line (rule 2), like
 * `withPersonKeys` migrates older answers.
 */
function withItems(draft: Record<string, unknown>): DraftItems {
  const saved = draft.items as Record<string, unknown> | undefined;
  const fromText = (field: string) =>
    typeof draft[field] === "string" ? itemsFromText(draft[field]) : [];
  const section = (key: keyof DraftItems, legacyField: string) =>
    atLeastOne(
      Array.isArray(saved?.[key]) && saved[key].every(isDraftItem)
        ? (saved[key] as DraftItem[])
        : fromText(legacyField),
    );

  return {
    prayer: section("prayer", "prayer"),
    praise: section("praise", "praise"),
    followUp: section("followUp", "discussion"),
  };
}

/** Drafts saved before guests were keyed by member id alone: "12" is "member:12". */
function withPersonKeys(
  answers: ReportDraft["answers"],
): ReportDraft["answers"] {
  return Object.fromEntries(
    Object.entries(answers).map(([key, answer]) => [
      /^\d+$/.test(key) ? `member:${key}` : key,
      answer,
    ]),
  );
}

/** Drafts saved before no meeting existed lack these three; they mean "met, no reason". */
function withMeetingDefaults(draft: ReportDraft): ReportDraft {
  const saved: Partial<ReportDraft> = draft;

  return {
    ...draft,
    items: withItems(draft as unknown as Record<string, unknown>),
    answers: withPersonKeys(draft.answers),
    met: typeof saved.met === "boolean" ? saved.met : true,
    reason: typeof saved.reason === "string" ? saved.reason : "",
    replacing: saved.replacing === true,
  };
}

export function loadLegacyDraft(
  groupId: number | string,
  meetingDate: string,
): ReportDraft | null {
  try {
    const raw = window.localStorage.getItem(legacyKey(groupId, meetingDate));

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    return isDraft(parsed) ? withMeetingDefaults(parsed) : null;
  } catch {
    return null;
  }
}

export function clearLegacyDraft(
  groupId: number | string,
  meetingDate: string,
) {
  try {
    window.localStorage.removeItem(legacyKey(groupId, meetingDate));
  } catch {
    // Nothing to clear.
  }
}
