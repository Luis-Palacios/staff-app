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

/** Small group leaders and deacons: they only see the groups their member leads. */
export const SCOPED_GROUP_ROLES: readonly AuthRole[] = [
  AuthRole.SmallGroupLeader,
  AuthRole.Deacon,
];

/** `full` sees every group, `scoped` only the ones they lead, `none` no groups at all. */
export type SmallGroupAccess = "full" | "scoped" | "none";

// Mirrors membership-management's `api/access.py` (FULL_ACCESS_ROLES, SCOPED_ROLES). The API is
// the guard; this only decides what to show. Change all three role mirrors together.
export function getSmallGroupAccess(
  role: string | null | undefined,
): SmallGroupAccess {
  if (STAFF_ADMIN_ROLES.some((allowed) => allowed === role)) return "full";
  if (SCOPED_GROUP_ROLES.some((allowed) => allowed === role)) return "scoped";

  return "none";
}

/**
 * What a caller can do with reports. `access` is `getSmallGroupAccess`; `canSubmit` is false for a
 * caller with no linked member (rule 5, access rule 10), who can still view, edit and delete.
 */
export function reportAccess(
  role: string | null | undefined,
  me: { member: unknown },
): { access: SmallGroupAccess; canSubmit: boolean } {
  const access = getSmallGroupAccess(role);

  return { access, canSubmit: access !== "none" && me.member !== null };
}

/** Only admins and elders link, unlink and invite from a member. */
export function canManageLinks(role: string | null | undefined): boolean {
  return STAFF_ADMIN_ROLES.some((allowed) => allowed === role);
}
