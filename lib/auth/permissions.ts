// What auth-server puts in the session (`permissions`) and the JWT (`perms`), computed from its
// `statements.ts`, the only role → permission map. This file lists the resource and action names
// the app checks (a typo fails `tsc`); it never says which role has what. Rule 10: anything missing
// is no permission.
export interface PermissionStatements {
  members: "all" | "view" | "search" | "create" | "update" | "link";
  membershipApplications: "view" | "approve" | "reject";
  smallGroups:
    | "all"
    | "view"
    | "create"
    | "update"
    | "close"
    | "setLeader"
    | "manageMembers";
  smallGroupReports:
    | "view"
    | "create"
    | "update"
    | "delete"
    | "viewObservations";
  invites: "create" | "cancel";
  ownProfile: "update";
  user: "create" | "list" | "get" | "ban" | "set-role";
  adminAccounts: "manage";
}

export type Resource = keyof PermissionStatements;
export type Action<R extends Resource = Resource> = PermissionStatements[R];

/** A required set of permissions, in better-auth's shape: `{ members: ["view", "all"] }`. */
export type PermissionCheck = {
  [R in Resource]?: readonly Action<R>[];
};

/** The session's `permissions`: a resource and the actions it allows. Others are ignored. */
export type Permissions = Readonly<Record<string, readonly string[]>>;

/** All-of: every action of every resource in `check` must be granted. An empty check passes. */
export function can(
  permissions: Permissions | null | undefined,
  check: PermissionCheck,
): boolean {
  return Object.entries(check).every(([resource, actions]) => {
    const granted = Object.hasOwn(permissions ?? {}, resource)
      ? permissions?.[resource]
      : undefined;

    return (actions as readonly string[]).every((action) =>
      granted?.includes(action),
    );
  });
}

/** `full` sees every group, `scoped` only the ones they lead, `none` no groups at all. */
export type SmallGroupAccess = "full" | "scoped" | "none";

// Rule 6: `smallGroups: all` is full access, `view` without `all` is the leader's own groups.
export function getSmallGroupAccess(
  permissions: Permissions | null | undefined,
): SmallGroupAccess {
  if (can(permissions, { smallGroups: ["all"] })) return "full";
  if (can(permissions, { smallGroups: ["view"] })) return "scoped";

  return "none";
}

/**
 * What a caller can do with reports. `access` is `getSmallGroupAccess`; `canSubmit` is false for a
 * caller with no linked member (rule 5, access rule 10), who can still view, edit and delete.
 */
export function reportAccess(
  permissions: Permissions | null | undefined,
  me: { member: unknown },
): { access: SmallGroupAccess; canSubmit: boolean } {
  const access = getSmallGroupAccess(permissions);

  return {
    access,
    canSubmit:
      access !== "none" &&
      can(permissions, { smallGroupReports: ["create"] }) &&
      me.member !== null,
  };
}

/** Link, unlink and invite from a member (the Account card). */
export function canManageLinks(
  permissions: Permissions | null | undefined,
): boolean {
  return can(permissions, { members: ["link"] });
}

/**
 * What the caller can do to another user's account on `/users/[id]`. Nobody changes their own role
 * or bans themselves (user-admin-actions rule 6). Whether the *target* is an admin account isn't
 * known here (no role → permission map in this app), so auth-server's guard rejects that case and
 * the form shows its message.
 */
export function userAccountAccess(
  permissions: Permissions | null | undefined,
  callerId: string,
  targetId: string,
): { changeRole: boolean; ban: boolean; assignAdmin: boolean } {
  const other = callerId !== targetId;

  return {
    changeRole: other && can(permissions, { user: ["set-role"] }),
    ban: other && can(permissions, { user: ["ban"] }),
    assignAdmin: can(permissions, { adminAccounts: ["manage"] }),
  };
}

/**
 * Who sees report conversations: the audience of a report's observations (`viewObservations`, or
 * leading the group) and nobody else. `leadsGroup` is the caller's own knowledge: on Report detail
 * the group they lead, elsewhere whether their small group access is scoped. The API enforces the
 * scope; this decides what to show.
 */
export function canSeeConversations(
  permissions: Permissions | null | undefined,
  leadsGroup: boolean,
): boolean {
  return (
    can(permissions, { smallGroupReports: ["view"] }) &&
    (can(permissions, { smallGroupReports: ["viewObservations"] }) ||
      leadsGroup)
  );
}

/**
 * Whether the Conversations nav item, page and badge exist for this caller. Without a group in hand
 * "leads a group" is read from the access level: scoped access is the leaders' (rule 6).
 */
export function canSeeConversationsInbox(
  permissions: Permissions | null | undefined,
): boolean {
  return canSeeConversations(
    permissions,
    getSmallGroupAccess(permissions) === "scoped",
  );
}
