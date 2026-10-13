export interface MemberSummary {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export type SmallGroupRole = "member" | "leader" | "co_leader";

export interface MemberSmallGroup {
  smallGroupId: number;
  smallGroupName: string;
  role: SmallGroupRole;
  /** Date only, "YYYY-MM-DD". */
  joinedAt: string;
}

export interface MemberDetail extends MemberSummary {
  address: string | null;
  /** Date only, "YYYY-MM-DD". */
  birthDate: string | null;
  /** Current (active) groups only. */
  smallGroups: MemberSmallGroup[];
}

export interface MemberInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
}
