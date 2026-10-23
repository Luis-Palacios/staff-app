import type { ComponentType, SVGProps } from "react";
import type { Messages } from "next-intl";
import type { PermissionCheck, Permissions } from "@/lib/auth/permissions";

import { can, canSeeConversationsInbox } from "@/lib/auth/permissions";

export type SiteConfig = typeof siteConfig;

/** A Heroicons (or otherwise compatible) SVG icon component. */
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** Icon keys resolved by the sidebar's icon registry (`components/sidebar.tsx`). */
export type NavIconName =
  | "dashboard"
  | "members"
  | "groups"
  | "applications"
  | "conversations"
  | "access";

/** A key of the `Nav` namespace (messages/en.json). The sidebar and the
 *  breadcrumbs translate it, so config holds no display text. */
export type NavLabelKey = keyof Messages["Nav"];

export type NavChildItem = {
  labelKey: NavLabelKey;
  href: string;
  /** Permissions needed to see this link; omit to show it to everyone. */
  requires?: PermissionCheck;
};

export type NavItem = {
  labelKey: NavLabelKey;
  /** Either a registry key (`components/sidebar.tsx`) or an icon component directly. */
  icon: NavIconName | HeroIcon;
  /** Leaf link. Omit when the item only groups `items`. */
  href?: string;
  /** Permissions needed to see this item; omit to show it to everyone. It must match the check
   *  the page itself makes (`notFound()`), so a hidden page is also unreachable by URL. */
  requires?: PermissionCheck;
  /** A nav item whose visibility is a helper rather than a plain permission check, and which
   *  carries the sidebar's needs-my-reply badge. */
  conversations?: true;
  /** Hides the item from anyone who has all of these, for the leaf that stands in for a group. */
  unless?: PermissionCheck;
  /** Nested links — renders the item as a collapsible group, hidden when none is visible. */
  items?: NavChildItem[];
};

export type Ministry = {
  id: string;
  name: string;
  /** Fallback for the tile when there is no logo. */
  initial: string;
  /** Square/circular mark shown in a 32px circle. Optional: ministries upload
   *  their own later; without one the tile shows `initial`. */
  logoUrl?: string;
};

export type Church = {
  id: string;
  name: string;
};

/** What the shell shows: the ministry, the church this session works in, and the
 *  churches the user may switch to (always includes `church`). */
export type ChurchContext = {
  ministry: Ministry;
  church: Church;
  churches: Church[];
};

export const siteConfig = {
  name: "ekklesiaio",
  // Hard-coded until multi-tenancy exists. Read only through
  // `getChurchContext()` (`lib/workspace.ts`), never directly: later the
  // ministry and churches come from the session / auth-server.
  ministry: {
    id: "petra",
    name: "Ministerio Cristiano Petra",
    initial: "P",
    logoUrl: "/ministries/petra-mark.png",
  } satisfies Ministry,
  churches: [{ id: "petra-managua", name: "Petra Managua" }] satisfies Church[],
  links: {
    // The landing page redirects this to /en/ or /es/ for the visitor.
    privacy: "https://ekklesiaio.com/privacy",
  },
  navItems: [
    {
      labelKey: "dashboard",
      icon: "dashboard",
      items: [
        {
          labelKey: "dashboardReportStatus",
          href: "/",
          requires: { smallGroups: ["all"] },
        },
        {
          labelKey: "dashboardPrayer",
          href: "/dashboard/prayer",
          requires: { smallGroups: ["all"] },
        },
        {
          labelKey: "dashboardApplicationsAccess",
          href: "/dashboard/staff",
          requires: { smallGroups: ["all"] },
        },
      ],
    },
    // Leaders and deacons: their own groups, then the prayer page scoped to them.
    {
      labelKey: "dashboard",
      icon: "dashboard",
      unless: { smallGroups: ["all"] },
      items: [
        {
          labelKey: "dashboardMyGroups",
          href: "/",
          requires: { smallGroups: ["view"] },
        },
        {
          labelKey: "dashboardPrayer",
          href: "/dashboard/prayer",
          requires: { smallGroups: ["view"] },
        },
      ],
    },
    {
      labelKey: "dashboard",
      icon: "dashboard",
      href: "/",
      unless: { smallGroups: ["view"] },
    },
    {
      labelKey: "conversations",
      icon: "conversations",
      href: "/conversations",
      conversations: true,
    },
    {
      labelKey: "members",
      icon: "members",
      href: "/members",
      requires: { members: ["view", "all"] },
    },
    {
      labelKey: "groups",
      icon: "groups",
      items: [
        {
          labelKey: "groupsList",
          href: "/groups",
          requires: { smallGroups: ["view"] },
        },
        {
          labelKey: "groupsReports",
          href: "/groups/reports",
          requires: { smallGroups: ["view"] },
        },
      ],
    },
    {
      labelKey: "applications",
      icon: "applications",
      href: "/applications",
      requires: { membershipApplications: ["view"] },
    },
    {
      labelKey: "access",
      icon: "access",
      items: [
        {
          labelKey: "users",
          href: "/users",
          requires: { user: ["list"] },
        },
        {
          labelKey: "invites",
          href: "/users/invites",
          requires: { invites: ["create"] },
        },
      ],
    },
  ] satisfies NavItem[],
};

/**
 * The nav the caller sees: items and links whose `requires` pass and whose `unless` doesn't, and
 * groups left with no link dropped. The pages make the same checks (`notFound()`).
 */
export function getVisibleNavItems(permissions: Permissions): NavItem[] {
  const visible = (entry: {
    requires?: PermissionCheck;
    unless?: PermissionCheck;
    conversations?: true;
  }) =>
    (!entry.conversations || canSeeConversationsInbox(permissions)) &&
    (!entry.requires || can(permissions, entry.requires)) &&
    (!entry.unless || !can(permissions, entry.unless));

  return siteConfig.navItems.flatMap((item: NavItem) => {
    if (!visible(item)) return [];
    if (!item.items) return [item];

    const items = item.items.filter(visible);

    return items.length > 0 ? [{ ...item, items }] : [];
  });
}
