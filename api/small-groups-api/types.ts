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
