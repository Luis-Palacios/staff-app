// Mirrors auth-server/src/lib/auth.ts's adminPlugin({ roles: {...} }) — kept in sync by hand,
// same "reviewed duplication" tradeoff as the role→permission mapping described in
// docs/AUTH-INTEGRATION-ROADMAP.md.
export type AuthRole =
  | "admin"
  | "user"
  | "smallGroupLeader"
  | "deacon"
  | "pending"
  | "elder";

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
}

export interface AuthSessionData {
  id: string;
  userId: string;
  expiresAt: string;
}

export interface AuthSession {
  session: AuthSessionData;
  user: AuthSessionUser;
}

export interface AuthToken {
  token: string;
}
