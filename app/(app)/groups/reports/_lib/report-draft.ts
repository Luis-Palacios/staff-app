/**
 * The unsent report, kept in the browser so a phone call mid-flow doesn't lose
 * answers. Never the source of truth: every read and write is wrapped, and the
 * flow works without it (private windows, blocked storage).
 */

import {
  type DraftItem,
  type DraftItems,
  itemsFromText,
  newDraftItem,
} from "./report-items-draft";

export interface ReportDraftAnswer {
  attendedGroup: boolean | null;
  attendedChurch: boolean | null;
  observation: string;
}

export interface ReportDraft {
  address: string;
  /** The three sections as items (people keep their full name so chips render at once). */
  items: DraftItems;
  /** Step 1: did the group meet? Defaults to yes; a no meeting uses only `reason`. */
  met: boolean;
  /** Kept when the leader switches back to yes, but only sent for a no meeting. */
  reason: string;
  /** The date has a no-meeting mark and the leader chose to replace it on submit. */
  replacing: boolean;
  /** Keyed by `personKey`: "member:12" or "guest:4". */
  answers: Record<string, ReportDraftAnswer>;
}

export function draftKey(groupId: number | string, meetingDate: string) {
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

export function loadDraft(
  groupId: number | string,
  meetingDate: string,
): ReportDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(groupId, meetingDate));

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    return isDraft(parsed) ? withMeetingDefaults(parsed) : null;
  } catch {
    return null;
  }
}

export function saveDraft(
  groupId: number | string,
  meetingDate: string,
  draft: ReportDraft,
) {
  try {
    window.localStorage.setItem(
      draftKey(groupId, meetingDate),
      JSON.stringify(draft),
    );
  } catch {
    // Storage unavailable or full: the draft is a convenience only.
  }
}

export function clearDraft(groupId: number | string, meetingDate: string) {
  try {
    window.localStorage.removeItem(draftKey(groupId, meetingDate));
  } catch {
    // Nothing to clear.
  }
}
