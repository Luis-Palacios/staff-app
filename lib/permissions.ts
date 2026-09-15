import type { NavItem } from "@/config/site";

/**
 * Hand-ported from auth-server/src/permissions/statements.ts — deliberately duplicated, not
 * synced automatically. Review together whenever statements.ts changes (same tradeoff Phase 5 of
 * docs/AUTH-INTEGRATION-ROADMAP.md accepts for membership-applications' Python port, just
 * TypeScript-to-TypeScript and earlier). Only tracks the `view`/`list`-equivalent action per
 * resource — nav visibility and route gating only care about "can this role see this section at
 * all," not full CRUD granularity (create/update/delete stay enforced server-side).
 */
export type Role =
  | "pending"
  | "user"
  | "smallGroupLeader"
  | "deacon"
  | "elder"
  | "admin";

const ROLES: readonly Role[] = [
  "pending",
  "user",
  "smallGroupLeader",
  "deacon",
  "elder",
  "admin",
];

/** Parses an untrusted role string (e.g. from a get-session response) into a known Role. */
export function parseRole(value: string | null | undefined): Role | null {
  return (ROLES as readonly string[]).includes(value ?? "")
    ? (value as Role)
    : null;
}

/**
 * A section of the app gated by a resource in auth-server's statements.ts. `userAccounts` maps
 * to that file's `user` resource (the admin-plugin's own account list) — named differently here
 * to avoid clashing with the `user` *role* above.
 */
export type Resource =
  | "dashboard"
  | "smallGroups"
  | "smallGroupsReport"
  | "membershipApplications"
  | "userAccounts";

const roleCanView: Record<Role, Record<Resource, boolean>> = {
  pending: {
    dashboard: false,
    smallGroups: false,
    smallGroupsReport: false,
    membershipApplications: false,
    userAccounts: false,
  },
  user: {
    dashboard: false,
    smallGroups: false,
    smallGroupsReport: false,
    membershipApplications: false,
    userAccounts: false,
  },
  smallGroupLeader: {
    dashboard: false,
    smallGroups: true,
    smallGroupsReport: true,
    membershipApplications: false,
    userAccounts: false,
  },
  deacon: {
    dashboard: false,
    smallGroups: true,
    smallGroupsReport: true,
    membershipApplications: false,
    userAccounts: false,
  },
  elder: {
    dashboard: true,
    smallGroups: true,
    smallGroupsReport: true,
    membershipApplications: true,
    userAccounts: true,
  },
  admin: {
    dashboard: true,
    smallGroups: true,
    smallGroupsReport: true,
    membershipApplications: true,
    userAccounts: true,
  },
};

export function canView(role: Role | null, resource: Resource): boolean {
  if (!role) return false;

  return roleCanView[role][resource];
}

/** Filters navItems (and each group's children) down to what `role` can view. */
export function getVisibleNavItems(
  navItems: NavItem[],
  role: Role | null,
): NavItem[] {
  return navItems.flatMap((item) => {
    if (item.items) {
      const visibleChildren = item.items.filter(
        (child) => child.resource && canView(role, child.resource),
      );

      return visibleChildren.length > 0
        ? [{ ...item, items: visibleChildren }]
        : [];
    }

    return item.resource && canView(role, item.resource) ? [item] : [];
  });
}

/** First href `role` can actually reach, walking into the first visible group if needed. */
export function firstVisibleHref(
  navItems: NavItem[],
  role: Role | null,
): string | null {
  const visible = getVisibleNavItems(navItems, role);
  const [first] = visible;

  if (!first) return null;
  if (first.href) return first.href;

  return first.items?.[0]?.href ?? null;
}
