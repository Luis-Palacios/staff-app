/**
 * The unsent report, kept in the browser so a phone call mid-flow doesn't lose
 * answers. Never the source of truth: every read and write is wrapped, and the
 * flow works without it (private windows, blocked storage).
 */

export interface ReportDraftAnswer {
  attendedGroup: boolean | null;
  attendedChurch: boolean | null;
  observation: string;
}

export interface ReportDraft {
  address: string;
  prayer: string;
  praise: string;
  discussion: string;
  /** Keyed by member id. */
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
    typeof draft.prayer === "string" &&
    typeof draft.praise === "string" &&
    typeof draft.discussion === "string" &&
    typeof draft.answers === "object" &&
    draft.answers !== null
  );
}

export function loadDraft(
  groupId: number | string,
  meetingDate: string,
): ReportDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(groupId, meetingDate));

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    return isDraft(parsed) ? parsed : null;
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
