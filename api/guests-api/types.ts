import type {
  LeftReason,
  NewGuestInput,
  SmallGroupRole,
} from "@/api/small-groups-api/types";

export type GuestStatus = "all" | "active" | "inactive";

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
  status?: GuestStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

/** What search shows to recognise someone, and nothing more: no email, address or notes. */
export interface GuestSearchItem {
  id: number;
  name: string;
  phoneLast4: string | null;
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
