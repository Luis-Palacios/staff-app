import type {
  LeftReason,
  NewGuestInput,
  SmallGroupRole,
} from "@/api/small-groups-api/types";

export type GuestStatus = "active" | "inactive";

/** The Guests list's tabs. */
export type GuestStatusFilter = "all" | GuestStatus;

export type GuestInactiveReason =
  | "moved_away"
  | "stopped_attending"
  | "joined_another_church"
  | "deceased"
  | "other";

export interface GuestCurrentGroup {
  id: number;
  name: string;
  /** Date only, "YYYY-MM-DD". */
  joinedAt: string;
}

export interface GuestLastGroup {
  id: number;
  name: string;
  leftAt: string;
  leftReason: LeftReason | null;
}

export interface GuestListItem {
  id: number;
  name: string;
  phone: string | null;
  firstVisitDate: string | null;
  status: GuestStatus;
  /** The date they left, from the latest deactivation; null while active. */
  inactiveSince: string | null;
  /** Private (rule 9): null without `guests: deactivate`. */
  inactiveReason: GuestInactiveReason | null;
  /** At most one of these is set; neither for a guest who never was in a group. */
  currentGroup: GuestCurrentGroup | null;
  lastGroup: GuestLastGroup | null;
  lastAttendedDate: string | null;
  /** In the current group as of today; null when in no group. */
  missedStreak: number | null;
}

export interface GuestList {
  items: GuestListItem[];
  /** For the tabs; ignores `status`. */
  counts: { all: number; active: number; inactive: number };
  total: number;
  page: number;
  pageSize: number;
}

export interface GuestListParams {
  status?: GuestStatusFilter;
  q?: string;
  page?: number;
  pageSize?: number;
}

/** What search shows to recognise someone, and nothing more: no email, address or notes. */
export interface GuestSearchItem {
  id: number;
  name: string;
  phoneLast4: string | null;
  status: GuestStatus;
  /** The date they left; never why (rule 7). */
  inactiveSince: string | null;
  currentGroup: GuestCurrentGroup | null;
  lastGroup: Pick<GuestLastGroup, "id" | "name" | "leftAt"> | null;
  lastAttendedDate: string | null;
}

export interface GuestRef {
  id: number;
  name: string;
}

export interface GuestPeriod {
  smallGroupId: number;
  smallGroupName: string;
  role: SmallGroupRole;
  joinedAt: string;
  leftAt: string | null;
  leftReason: LeftReason | null;
}

export interface GuestAttendance {
  reportId: number;
  meetingDate: string;
  smallGroup: GuestRef;
  attendedGroup: boolean;
  attendedChurch: boolean;
  /** Null unless the viewer may read this row's observations. */
  observation: string | null;
}

/** One change of status, as `MemberStatusChange` for a member. */
export interface GuestStatusChange {
  status: GuestStatus;
  /** Null on a reactivation. */
  reason: GuestInactiveReason | null;
  /** Date only: the date they left, or the day of reactivation. */
  effectiveDate: string;
  note: string | null;
  changedByUserId: string;
  /** The member linked to that user, by current name. */
  changedByName: string | null;
  /** ISO timestamp. */
  createdAt: string;
}

export interface GuestDetail {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  sex: "male" | "female" | null;
  address: string | null;
  firstVisitDate: string | null;
  invitedBy: GuestRef | null;
  createdBy: GuestRef | null;
  /** ISO timestamp. */
  createdAt: string;
  status: GuestStatus;
  /** The date they left, from the latest deactivation; null while active. */
  inactiveSince: string | null;
  /** The next three are private (rule 9): null without `guests: deactivate`. */
  inactiveReason: GuestInactiveReason | null;
  inactiveNote: string | null;
  /** Newest first. */
  statusHistory: GuestStatusChange[] | null;
  currentGroup: GuestCurrentGroup | null;
  lastAttendedDate: string | null;
  /** Every period in a guest group, newest first. */
  groupHistory: GuestPeriod[];
  /** The last 12 rows; a leader only gets the groups they lead. */
  recentAttendance: GuestAttendance[];
}

/** A new guest in no group, or straight into a guest group (`smallGroupId`, joining today). */
export interface GuestCreateInput extends NewGuestInput {
  smallGroupId?: number | null;
}

/** Contact, first visit, invited by; never groups. `null` clears an optional field. */
export type GuestUpdateInput = Partial<NewGuestInput>;

export interface GuestDeactivateInput {
  reason: GuestInactiveReason;
  /** The date they left: today or earlier. */
  effectiveDate: string;
  note?: string | null;
}
