export type MemberStatus = "active" | "inactive";

/** `GET /members?status=`: the API returns active members unless asked (inactive-members rule 11). */
export type MemberStatusFilter = MemberStatus | "all";

export type MemberInactiveReason =
  | "moved_away"
  | "transferred"
  | "stopped_attending"
  | "church_discipline"
  | "deceased"
  | "other";

export interface MemberSummary {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  /** Id of the linked auth-server user, or null. */
  userId: string | null;
  status: MemberStatus;
  /** The date they left, "YYYY-MM-DD"; null while active. */
  inactiveSince: string | null;
  /** Private (rule 5): null without `members: setStatus`. */
  inactiveReason: MemberInactiveReason | null;
}

/** A member as the add-member picker needs them: GET /members/options, names only. */
export interface MemberOption {
  id: number;
  name: string;
  /** Only `GET /members/search` sends it; `/members/options` lists active members only. */
  status?: MemberStatus;
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

/** A period the member's latest deactivation ended. */
export interface MemberPastSmallGroup extends MemberSmallGroup {
  /** Date only, "YYYY-MM-DD". */
  leftAt: string;
}

export interface MemberDetail extends MemberSummary {
  address: string | null;
  /** Date only, "YYYY-MM-DD". */
  birthDate: string | null;
  sex: MemberSex | null;
  /** Current (active) groups only. */
  smallGroups: MemberSmallGroup[];
  /** Private (rule 5): null without `members: setStatus`. */
  inactiveNote: string | null;
  /** Periods closed by the latest deactivation; empty while active. */
  pastSmallGroups: MemberPastSmallGroup[];
}

export interface MemberDeactivateInput {
  reason: MemberInactiveReason;
  /** The date they left, "YYYY-MM-DD", today or earlier. */
  effectiveDate: string;
  note?: string | null;
}

/** One row of `GET /members/{id}/status-history` (`members: setStatus`), newest first. */
export interface MemberStatusChange {
  /** The status it changed to. */
  status: MemberStatus;
  /** Set when `status` is `inactive`. */
  reason: MemberInactiveReason | null;
  /** Date only, "YYYY-MM-DD". */
  effectiveDate: string;
  note: string | null;
  changedByUserId: string;
  /** The member linked to `changedByUserId`, else null. */
  changedByName: string | null;
  createdAt: string;
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

/** Per-church settings the API owns; the app keeps no copy (guest-small-groups rule 1). */
export interface MeFeatures {
  guestGroups: boolean;
}

/** The signed-in user's member (if linked) and the groups they actively lead. */
export interface Me {
  userId: string;
  role: string;
  member: { id: number; name: string } | null;
  leads: MeLead[];
  features: MeFeatures;
}
