// Single source of truth for auth role *names* within staff-app, mirroring
// auth-server/src/permissions/statements.ts's role set by hand — see
// docs/infrastructure/AUTH-INTEGRATION-ROADMAP.md for that cross-repo tradeoff.
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

export const STAFF_ADMIN_ROLES: readonly AuthRole[] = [
  AuthRole.Admin,
  AuthRole.Elder,
];

/**
 * @deprecated Display text lives in the `Roles` message namespace: call
 * `t(role)` from `useTranslations("Roles")` / `getTranslations("Roles")`.
 * Kept until the users and invites pages move over (i18n Stages 10–11).
 */
export const ROLE_LABELS: Record<AuthRole, string> = {
  [AuthRole.Admin]: "Admin",
  [AuthRole.User]: "User",
  [AuthRole.SmallGroupLeader]: "Small Group Leader",
  [AuthRole.Deacon]: "Deacon",
  [AuthRole.Pending]: "Pending",
  [AuthRole.Elder]: "Elder",
};
