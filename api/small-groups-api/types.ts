import type { ConversationStatus } from "@/api/conversations-api/types";
import type { SmallGroupRole } from "@/api/members-api/types";

export type { SmallGroupRole };

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface SmallGroupSummary {
  id: number;
  name: string;
  meetingAddress: string | null;
  meetingDay: Weekday | null;
  /** Date only, "YYYY-MM-DD". */
  closedAt: string | null;
  activeMemberCount: number;
  /** Null when there is no active leader, and for closed groups. */
  leaderMemberId: number | null;
  leaderName: string | null;
}

export interface SmallGroupMember {
  memberId: number;
  memberName: string;
  role: SmallGroupRole;
  /** Date only, "YYYY-MM-DD". */
  joinedAt: string;
}

export interface SmallGroupDetail {
  id: number;
  name: string;
  meetingAddress: string | null;
  meetingDay: Weekday | null;
  /** Date only, "YYYY-MM-DD". */
  closedAt: string | null;
  /** Active members only. */
  members: SmallGroupMember[];
}

export interface SmallGroupInput {
  name: string;
  meetingAddress?: string | null;
  meetingDay?: Weekday | null;
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
  smallGroup: { id: number; name: string; closedAt: string | null };
  meetingDate: string;
  submittedBy: ReportPerson;
  /** ISO timestamp with offset. */
  submittedAt: string;
  /** False = the group didn't meet that date (a no meeting); the counts are then 0. */
  held: boolean;
  notHeldReason: string | null;
  rosterCount: number;
  attendedGroupCount: number;
  attendedChurchCount: number;
}

export interface NotFiledItem {
  kind: "notFiled";
  smallGroup: { id: number; name: string; closedAt: string | null };
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
}

export interface ReportWeekGroup {
  smallGroup: { id: number; name: string; meetingDay: Weekday | null };
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
  /** Open groups, by name. */
  groups: ReportWeekGroup[];
}

/** The report texts a thread can be about, in the page's order. */
export type ReportSectionKey = "prayer" | "praise" | "followUp";

/** A section thread's indicator on a shared entry; `unread` and `needsMyReply` are the caller's. */
export interface ReportSharedConversation {
  id: number;
  status: ConversationStatus;
  commentCount: number;
  unread: boolean;
  needsMyReply: boolean;
}

/** One held report in the week, with its three texts. */
export interface ReportSharedEntry {
  reportId: number;
  meetingDate: string;
  smallGroup: { id: number; name: string };
  /** Active today: the leader, then co-leaders by name. */
  leaders: ReportWeekGroup["leaders"];
  /** Null when empty after trimming; line breaks kept. */
  prayer: string | null;
  praise: string | null;
  followUp: string | null;
  /** Section threads only; a key is absent when that section has no thread. */
  conversations: Partial<Record<ReportSectionKey, ReportSharedConversation>>;
}

/** An open group that may still add texts this week, or (past weeks) didn't file. */
export interface ReportStillToReport {
  smallGroup: { id: number; name: string };
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
  memberId: number;
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
  memberId: number;
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
    meetingAddress: string | null;
    closedAt: string | null;
  };
  meetingDate: string;
  churchSunday: string;
  /** False = a no meeting: no attendances, no texts, only `notHeldReason`. */
  held: boolean;
  notHeldReason: string | null;
  address: string | null;
  groupPrayerRequest: string | null;
  groupPraiseReport: string | null;
  groupRelevantDiscussion: string | null;
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

export interface ReportAttendanceInput {
  memberId: number;
  attendedGroup: boolean;
  attendedChurch: boolean;
  /** Leave out when the caller can't see observations (the API keeps them). */
  observation?: string | null;
}

/** Create body; PATCH replaces the whole report with the same shape. */
export interface ReportInput {
  held?: true;
  meetingDate: string;
  address?: string | null;
  groupPrayerRequest?: string | null;
  groupPraiseReport?: string | null;
  groupRelevantDiscussion?: string | null;
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
