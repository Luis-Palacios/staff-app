import type { ConversationStatus } from "@/api/conversations-api/types";
import type { SmallGroupRole } from "@/api/members-api/types";

export type { SmallGroupRole };

/** Who a group is for, fixed when it is created. */
export type GroupAudience = "members" | "guests";

/** Who a participant, attendance row or conversation is about: a member or a guest. */
export type Person =
  | { type: "member"; id: number; name: string }
  | { type: "guest"; id: number; name: string };

/** Why a period in a group ended. Null for role changes, group closes and older history. */
export type LeftReason = "stopped_coming" | "moved_group" | "other";

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SmallGroupSummary {
  id: number;
  name: string;
  audience: GroupAudience;
  meetingAddress: string | null;
  meetingDay: Weekday | null;
  /** Date only, "YYYY-MM-DD". */
  closedAt: string | null;
  /** Members only; a guest group's guests are in `activeGuestCount`. */
  activeMemberCount: number;
  activeGuestCount: number;
  /** Null when there is no active leader, and for closed groups. */
  leaderMemberId: number | null;
  leaderName: string | null;
}

export interface SmallGroupMember {
  person: Person;
  role: SmallGroupRole;
  /** Date only, "YYYY-MM-DD". */
  joinedAt: string;
  /** Guest rows of a guest group only: reports missed in a row as of today. */
  missedStreak?: number | null;
  /** Guest rows of a guest group only: last meeting they attended, null if never. */
  lastAttendedDate?: string | null;
}

export interface SmallGroupDetail {
  id: number;
  name: string;
  audience: GroupAudience;
  meetingAddress: string | null;
  meetingDay: Weekday | null;
  /** Date only, "YYYY-MM-DD". */
  closedAt: string | null;
  /** The two counts are never added together. */
  memberCount: number;
  guestCount: number;
  /** Active participants: members, then (guest groups) guests. */
  members: SmallGroupMember[];
}

export interface SmallGroupInput {
  name: string;
  meetingAddress?: string | null;
  meetingDay?: Weekday | null;
  /** Create only; `guests` needs the setting on (409 `guest groups are off`). Never changes. */
  audience?: GroupAudience;
}

/** A person in a report. The API sends one `name`, not first and last. */
export interface ReportPerson {
  memberId: number;
  name: string;
}

/** `filed` is held reports only; a no meeting has its own value. */
export type ReportListStatus = "all" | "filed" | "notHeld" | "notFiled";

export interface ReportListParams {
  smallGroupId?: number;
  /** Date only, "YYYY-MM-DD". */
  from?: string;
  to?: string;
  status?: ReportListStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface FiledReportItem {
  kind: "report";
  id: number;
  smallGroup: {
    id: number;
    name: string;
    audience: GroupAudience;
    closedAt: string | null;
  };
  meetingDate: string;
  submittedBy: ReportPerson;
  /** ISO timestamp with offset. */
  submittedAt: string;
  /** False = the group didn't meet that date (a no meeting); the counts are then 0. */
  held: boolean;
  notHeldReason: string | null;
  /** Set on a no meeting marked church-wide and still linked to its week. */
  noMeetingWeekId: number | null;
  rosterCount: number;
  attendedGroupCount: number;
  attendedChurchCount: number;
}

export interface NotFiledItem {
  kind: "notFiled";
  smallGroup: {
    id: number;
    name: string;
    audience: GroupAudience;
    closedAt: string | null;
  };
  meetingDate: string;
}

export type ReportListItem = FiledReportItem | NotFiledItem;

export interface ReportList {
  items: ReportListItem[];
  /** For the status control; ignores `status`. */
  counts: { all: number; filed: number; notHeld: number; notFiled: number };
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportSummaryGroup {
  smallGroup: {
    id: number;
    name: string;
    audience: GroupAudience;
    meetingDay: Weekday | null;
    closedAt: string | null;
  };
  /** The caller's role in the group; null for admins and elders. */
  role: SmallGroupRole | null;
  lastReport: {
    id: number;
    meetingDate: string;
    rosterCount: number;
    attendedGroupCount: number;
    submittedBy: ReportPerson;
  } | null;
  /** Newest first. */
  notFiledDates: string[];
  /** An active leader or co-leader today. */
  hasLeader: boolean;
  /** Newest first; every meeting date in the 28-day window, filed or not. */
  recentMeetings: ReportRecentMeeting[];
}

export interface ReportRecentMeeting {
  /** Date only, "YYYY-MM-DD". */
  date: string;
  /** Null when the meeting has no report. */
  reportId: number | null;
  /** Null when not filed; false when the group didn't meet. */
  held: boolean | null;
}

export type ReportWeekStatus =
  | "submitted"
  | "notHeld"
  | "notFiled"
  | "today"
  | "upcoming"
  | "noLeader"
  | "noMeetingDay";

export interface ReportWeekReport {
  id: number;
  meetingDate: string;
  rosterCount: number;
  attendedGroupCount: number;
  attendedChurchCount: number;
  /** Attendance rows with an observation; admins and elders only (reports rule 9). */
  observationCount: number;
  submittedBy: ReportPerson;
  held: boolean;
  notHeldReason: string | null;
  /** Set on a no meeting marked church-wide and still linked to its week. */
  noMeetingWeekId: number | null;
}

export interface ReportWeekGroup {
  smallGroup: {
    id: number;
    name: string;
    audience: GroupAudience;
    meetingDay: Weekday | null;
  };
  /** Active today: the leader, then co-leaders by name. */
  leaders: { memberId: number; name: string; role: SmallGroupRole }[];
  status: ReportWeekStatus;
  /** The week's date on the group's meeting day; null without a meeting day. */
  meetingDate: string | null;
  /** Dated in the week, newest first. */
  reports: ReportWeekReport[];
}

export interface ReportWeek {
  /** The week's Sunday and Saturday, "YYYY-MM-DD". */
  weekStart: string;
  weekEnd: string;
  /** The church's today. */
  today: string;
  isCurrentWeek: boolean;
  /** Set when the week was marked church-wide as no meeting. */
  noMeetingWeek: NoMeetingWeek | null;
  /** Open groups, by name. */
  groups: ReportWeekGroup[];
}

/** A week marked as no meeting for every open group (church-wide no meeting). */
export interface NoMeetingWeek {
  id: number;
  /** The week's Sunday, "YYYY-MM-DD". */
  weekStart: string;
  reason: string | null;
  createdBy: ReportPerson;
  /** ISO timestamps with offset. */
  createdAt: string;
  updatedAt: string;
  /** Reports still linked to the week: a leader's edit or a held report unlinks one. */
  linkedCount: number;
}

/** What marking a week returns: the week and what this call did. */
export interface NoMeetingWeekMark extends NoMeetingWeek {
  /** No meetings created by this call. */
  marked: number;
  /** `reported`: groups with any report dated in the week, including ones this week marked before. */
  skipped: { reported: number; noMeetingDay: number };
}

/** The report sections a thread can be about, in the page's order. */
export type ReportSectionKey = "prayer" | "praise" | "followUp";

/** A tagged person on a read: the current name, and whether the caller may open their page. */
export type TaggedPerson = Person & { viewable: boolean };

/** Part of an item: plain text, or a tagged member or guest (report tags, segments). */
export type ReportSegment =
  | { type: "text"; text: string }
  | { type: "person"; person: TaggedPerson };

/** One request, reason to be thankful or point for the elders. Ids aren't stable across edits. */
export interface ReportItem {
  id: number;
  segments: ReportSegment[];
}

export type ReportSections = Record<ReportSectionKey, ReportItem[]>;

/** What a write sends: a person is only `{ type, id }`, the API fills in the name. */
export type ReportSegmentInput =
  | { type: "text"; text: string }
  | { type: "person"; person: { type: Person["type"]; id: number } };

export interface ReportItemInput {
  segments: ReportSegmentInput[];
}

export type ReportSectionsInput = Record<ReportSectionKey, ReportItemInput[]>;

/** What `/members/{id}/timeline` and `/guests/{id}/timeline` take (report tags, rule 22). */
export interface TimelineParams {
  /** Date only, "YYYY-MM-DD". */
  from?: string;
  to?: string;
  smallGroupId?: number;
  /** 1–10 newest visible rows (Recent activity); not with the others. */
  latest?: number;
}

export interface TimelineGroup {
  id: number;
  name: string;
  audience: GroupAudience;
}

/** Null `attendance` means the person isn't on the list or the caller can't see it (rule 23). */
export interface TimelineAttendance {
  /** Their role on the meeting date; null when no period covers it. */
  role: SmallGroupRole | null;
  attendedGroup: boolean;
  attendedChurch: boolean;
}

export interface TimelineObservation {
  text: string;
  submittedBy: { memberId: number; name: string };
}

/** An item that tags the person whose timeline it is. */
export interface TimelineItem extends ReportItem {
  section: ReportSectionKey;
}

export interface TimelineRow {
  reportId: number;
  /** Date only, "YYYY-MM-DD". */
  meetingDate: string;
  smallGroup: TimelineGroup;
  attendance: TimelineAttendance | null;
  observation: TimelineObservation | null;
  items: TimelineItem[];
}

export interface PersonTimeline {
  person: Person;
  /** Null with `latest`. Date only. */
  from: string | null;
  to: string | null;
  /** Oldest visible row, any group: whether "Show 3 more months" has anything to show. */
  earliestDate: string | null;
  /** Groups with a visible row at any date, for the group filter. */
  groups: TimelineGroup[];
  /** In the range and group, after rule 23. */
  counts: { notes: number; prayer: number; praise: number; followUp: number };
  rows: TimelineRow[];
}

/** A section thread's indicator on a shared entry; `unread` and `needsMyReply` are the caller's. */
export interface ReportSharedConversation {
  id: number;
  status: ConversationStatus;
  commentCount: number;
  unread: boolean;
  needsMyReply: boolean;
}

/** One held report in the week, with its three sections. */
export interface ReportSharedEntry {
  reportId: number;
  meetingDate: string;
  smallGroup: { id: number; name: string; audience: GroupAudience };
  /** Active today: the leader, then co-leaders by name. */
  leaders: ReportWeekGroup["leaders"];
  sections: ReportSections;
  /** Section threads only; a key is absent when that section has no thread. */
  conversations: Partial<Record<ReportSectionKey, ReportSharedConversation>>;
}

/** An open group that may still add texts this week, or (past weeks) didn't file. */
export interface ReportStillToReport {
  smallGroup: { id: number; name: string; audience: GroupAudience };
  status: Extract<ReportWeekStatus, "notFiled" | "today" | "upcoming">;
  meetingDate: string;
}

export interface ReportShared {
  /** The week's Sunday and Saturday, "YYYY-MM-DD". */
  weekStart: string;
  weekEnd: string;
  /** The church's today. */
  today: string;
  isCurrentWeek: boolean;
  /** Meeting date, oldest first, then group name. */
  entries: ReportSharedEntry[];
  /** `notFiled`, `today`, `upcoming`, then by name. */
  stillToReport: ReportStillToReport[];
}

export interface ReportRosterPerson {
  person: Person;
  name: string;
  role: SmallGroupRole;
  /** Date only, "YYYY-MM-DD". */
  joinedAt: string;
  /** Meetings missed in a row before this date (rule 11). */
  missedStreak: number;
}

export interface ReportRoster {
  smallGroup: {
    id: number;
    name: string;
    audience: GroupAudience;
    meetingAddress: string | null;
    meetingDay: Weekday | null;
    closedAt: string | null;
  };
  meetingDate: string;
  churchSunday: string;
  /** Set when a report already exists for that date (rule 1). */
  existingReportId: number | null;
  /** False when that report is a no meeting, which a held report may replace; null without one. */
  existingReportHeld: boolean | null;
  people: ReportRosterPerson[];
}

export interface ReportAttendance {
  person: Person;
  name: string;
  role: SmallGroupRole;
  attendedGroup: boolean;
  attendedChurch: boolean;
  missedStreak: number;
  /** Absent when `observationsVisible` is false (rule 9). */
  observation?: string | null;
}

export interface ReportDetail {
  id: number;
  smallGroup: {
    id: number;
    name: string;
    audience: GroupAudience;
    meetingAddress: string | null;
    closedAt: string | null;
  };
  meetingDate: string;
  churchSunday: string;
  /** False = a no meeting: no attendances, no texts, only `notHeldReason`. */
  held: boolean;
  notHeldReason: string | null;
  /** Set on a no meeting marked church-wide and still linked to its week. */
  noMeetingWeekId: number | null;
  address: string | null;
  sections: ReportSections;
  submittedBy: ReportPerson;
  submittedAt: string;
  observationsVisible: boolean;
  /** Threads on this report (what a delete takes with it); 0 for a no meeting. */
  conversationCount: number;
  attendances: ReportAttendance[];
  totals: {
    roster: number;
    attendedGroup: number;
    attendedChurch: number;
    /** Absent when observations aren't visible. */
    observations?: number;
  };
  permissions: { canEdit: boolean; canDelete: boolean };
}

interface ReportAttendanceFields {
  attendedGroup: boolean;
  attendedChurch: boolean;
  /** Leave out when the caller can't see observations (the API keeps them). */
  observation?: string | null;
}

/** One row per participant: a member's `memberId` or a guest's `guestId`, never both. */
export type ReportAttendanceInput = ReportAttendanceFields &
  (
    | { memberId: number; guestId?: never }
    | { guestId: number; memberId?: never }
  );

/** Create body; PATCH replaces the whole report with the same shape. */
export interface ReportInput {
  held?: true;
  meetingDate: string;
  address?: string | null;
  /** Always sent: it wins over the API's old text fields. Empty items are dropped there. */
  sections: ReportSectionsInput;
  attendances: ReportAttendanceInput[];
  /** Create only: delete the date's no meeting and insert this report in one transaction. */
  replacesNoMeeting?: boolean;
}

/** Create or PATCH body for a date the group didn't meet. */
export interface NoMeetingInput {
  held: false;
  meetingDate: string;
  /** At most 255; leave out or null for none. */
  notHeldReason?: string | null;
}

/** The fields of a new guest; everything but the name is optional. */
export interface NewGuestInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  sex?: "male" | "female" | null;
  address?: string | null;
  /** Date only; defaults to the day they join a group, or today. */
  firstVisitDate?: string | null;
  invitedByMemberId?: number | null;
}

/** Exactly one of `guestId` and `newGuest`. */
export type AddGuestInput = {
  /** Date only; defaults to today. The report form sends the meeting date. */
  joinedAt?: string;
  moveFromOtherGroup?: boolean;
} & (
  | { guestId: number; newGuest?: never }
  | { newGuest: NewGuestInput; guestId?: never }
);

export interface RemoveGuestInput {
  /** `moved_group` is only ever set by a move, so it isn't accepted. */
  leftReason?: Exclude<LeftReason, "moved_group">;
  /** Date only; defaults to today, never before they joined or a report that has them. */
  leftAt?: string;
}

/** The body of a 409 `in another group`: the guest's current group (name and date only). */
export interface OtherGroup {
  id: number;
  name: string;
  /** Date only, "YYYY-MM-DD". */
  joinedAt: string;
}

/** A row of the tag search: who they are and enough to tell people apart (rules 8, 10). */
export interface TaggablePerson {
  person: Person;
  inThisGroup: boolean;
  groups: {
    id: number;
    name: string;
    audience: GroupAudience;
    role: SmallGroupRole;
  }[];
  /** Guests only; null for members and for guests without 4 phone digits. */
  phoneLast4: string | null;
}
