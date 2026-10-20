export interface MemberSummary {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  /** Id of the linked auth-server user, or null. */
  userId: string | null;
}

/** A member as the add-member picker needs them: GET /members/options, names only. */
export interface MemberOption {
  id: number;
  name: string;
}

export type SmallGroupRole = "member" | "leader" | "co_leader";

export interface MemberSmallGroup {
  smallGroupId: number;
  smallGroupName: string;
  role: SmallGroupRole;
  /** Date only, "YYYY-MM-DD". */
  joinedAt: string;
}

export type MemberSex = "male" | "female";

export interface MemberDetail extends MemberSummary {
  address: string | null;
  /** Date only, "YYYY-MM-DD". */
  birthDate: string | null;
  sex: MemberSex | null;
  /** Current (active) groups only. */
  smallGroups: MemberSmallGroup[];
}

export interface MemberInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  sex?: MemberSex | null;
}

/** `PATCH /me/member`: the five fields the user may edit on their own member. No email. */
export type OwnMemberInput = Partial<Omit<MemberInput, "email">>;

export interface MeLead {
  smallGroupId: number;
  name: string;
  role: "leader" | "co_leader";
}

/** The signed-in user's member (if linked) and the groups they actively lead. */
export interface Me {
  userId: string;
  role: string;
  member: { id: number; name: string } | null;
  leads: MeLead[];
}
