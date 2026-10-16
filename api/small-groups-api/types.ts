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

export type ReportListStatus = "all" | "filed" | "notFiled";

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
  counts: { all: number; filed: number; notFiled: number };
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
  address: string | null;
  groupPrayerRequest: string | null;
  groupPraiseReport: string | null;
  groupRelevantDiscussion: string | null;
  submittedBy: ReportPerson;
  submittedAt: string;
  observationsVisible: boolean;
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
  meetingDate: string;
  address?: string | null;
  groupPrayerRequest?: string | null;
  groupPraiseReport?: string | null;
  groupRelevantDiscussion?: string | null;
  attendances: ReportAttendanceInput[];
}
