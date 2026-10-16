// Auth role *names*, for display (labels, badges) and for assigning a role (users page, invites).
// What a role can do is not decided here or anywhere in this app: auth-server's
// `src/permissions/statements.ts` is the only role → permission map, and this app checks the
// `permissions` it ships in the session (`lib/auth/permissions.ts`). Keep this list in step with
// the roles declared there.
export const AuthRole = {
  Admin: "admin",
  User: "user",
  SmallGroupLeader: "smallGroupLeader",
  Deacon: "deacon",
  Pending: "pending",
  Elder: "elder",
} as const;

export type AuthRole = (typeof AuthRole)[keyof typeof AuthRole];

export const AUTH_ROLES = Object.values(AuthRole) as AuthRole[];
