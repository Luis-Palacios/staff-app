// Hand-written types for membership-management's `/care-log` routes (care spec Part 1). camelCase,
// like the API. A person is only ever a member or a guest; the care log has no other kind.

export type CareLogKind =
  | "call"
  | "message"
  | "meeting"
  | "visit"
  | "heard"
  | "note";

/** Only call, meeting and visit can be planned (rule 6). */
export const PLANNABLE_KINDS: readonly CareLogKind[] = [
  "call",
  "meeting",
  "visit",
];

export type CareLogStatus = "done" | "planned" | "cancelled";
export type CareLogMeetingMode = "inPerson" | "online";
export type CareLogVisibility = "leaders" | "private";

/** What a write sends for a person: the API fills in the name. */
export type CareLogPersonInput = { memberId: number } | { guestId: number };

export type CareLogSourceInput =
  | { kind: "attendance"; reportId: number; memberId: number }
  | { kind: "attendance"; reportId: number; guestId: number }
  | {
      kind: "section";
      reportId: number;
      section: "prayer" | "praise" | "followUp";
    }
  | { kind: "conversation"; conversationId: number };

export interface CareLogCreateInput {
  kind: CareLogKind;
  /** `done` when left out. */
  status?: "done" | "planned";
  /** Required for a meeting only. */
  meetingMode?: CareLogMeetingMode | null;
  /** "YYYY-MM-DD"; a done entry is never in the future. */
  occurredOn: string;
  /** "HH:MM" */
  occurredAtTime?: string | null;
  people: CareLogPersonInput[];
  others?: string | null;
  participants?: number[];
  /** Required for `heard`. */
  heardFrom?: string | null;
  /** Optional only for a planned entry. */
  text?: string | null;
  /** `leaders` when left out. */
  visibility?: CareLogVisibility;
  source?: CareLogSourceInput | null;
}

/** A PATCH: any create field except `status` and `source`. */
export type CareLogUpdateInput = Partial<
  Omit<CareLogCreateInput, "status" | "source">
>;

export interface CareLogPersonRef {
  memberId: number | null;
  guestId: number | null;
  name: string;
  /** Whether the viewer may open this person's page, so their name links. */
  viewable: boolean;
}

export interface CareLogSourceRef {
  kind: "attendance" | "section" | "conversation";
  section: "prayer" | "praise" | "followUp" | null;
  reportId: number | null;
  /** "YYYY-MM-DD" */
  meetingDate: string | null;
  smallGroup: { id: number; name: string } | null;
  /** False: "A report note you don't have access to", no link. */
  visible: boolean;
  /** True: the report or thread was deleted. */
  gone: boolean;
}

export interface CareLogEntry {
  id: number;
  kind: CareLogKind;
  status: CareLogStatus;
  meetingMode: CareLogMeetingMode | null;
  occurredOn: string;
  occurredAtTime: string | null;
  people: CareLogPersonRef[];
  others: string | null;
  participants: { memberId: number; name: string }[];
  heardFrom: string | null;
  text: string | null;
  visibility: CareLogVisibility;
  cancelReason: string | null;
  author: { memberId: number; name: string };
  source: CareLogSourceRef | null;
  /** Planned and its date has passed: *Record how it went*. */
  pastDue: boolean;
  canEdit: boolean;
  canComplete: boolean;
  editedAt: string | null;
  createdAt: string;
}

/** One row of `GET /care-log/people-search`: who to log care about. */
export interface CareLogPersonOption {
  person: { type: "member" | "guest"; id: number; name: string };
  groups: {
    id: number;
    name: string;
    audience: "members" | "guests";
    role: string;
  }[];
  /** To tell two people with the same name apart. */
  phoneLast4: string | null;
}

export interface CareLogAudienceInput {
  people: CareLogPersonInput[];
  visibility: CareLogVisibility;
  participants: number[];
}

/** `sees` is null when the API can't say; no warning then. */
export interface CareLogAudience {
  participants: { memberId: number; sees: boolean | null }[];
}

export interface CareLogCompleteInput {
  text: string;
  /** The actual date; the planned one when left out. */
  occurredOn?: string;
}

export interface CareLogComingUp {
  /** Oldest first. */
  pastDue: CareLogEntry[];
  /** Today to 7 days ahead, soonest first. */
  upcoming: CareLogEntry[];
}

/** The `code` of a 422/409/403 body the form tells apart. */
export type CareLogErrorCode =
  | "kind_status"
  | "date"
  | "text"
  | "others"
  | "heard_from"
  | "meeting_mode"
  | "people"
  | "participants"
  | "reason"
  | "status"
  | "source"
  | "kind"
  | "visibility"
  | "link"
  | "not_planned"
  | "author";
