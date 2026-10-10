import type { ComponentType, SVGProps } from "react";

export type SiteConfig = typeof siteConfig;

/** A Heroicons (or otherwise compatible) SVG icon component. */
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** Icon keys resolved by the sidebar's icon registry (`components/sidebar.tsx`). */
export type NavIconName = "dashboard" | "groups" | "applications" | "access";

export type NavChildItem = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  /** Either a registry key (`components/sidebar.tsx`) or an icon component directly. */
  icon: NavIconName | HeroIcon;
  /** Leaf link. Omit when the item only groups `items`. */
  href?: string;
  /** Nested links — renders the item as a collapsible group. */
  items?: NavChildItem[];
};

/** The church this staff app is working in (shown in the sidebar's `WorkspaceBadge`). */
export type Workspace = {
  name: string;
  /** Single letter for the badge tile. */
  initial: string;
};

export const siteConfig = {
  name: "ekklesiaio",
  description: "Manage staff, groups, applications, and reports efficiently.",
  // Hard-coded for now. Per-church branding will replace this with the
  // signed-in user's church (and later its logo/colors).
  workspace: { name: "Iglesia Petra", initial: "P" } satisfies Workspace,
  links: {
    // The landing page redirects this to /en/ or /es/ for the visitor.
    privacy: "https://ekklesiaio.com/privacy",
  },
  navItems: [
    {
      label: "Dashboard",
      icon: "dashboard",
      href: "/",
    },
    {
      label: "Groups",
      icon: "groups",
      items: [
        {
          label: "List",
          href: "/groups",
        },
        {
          label: "Reports",
          href: "/groups/reports",
        },
      ],
    },
    {
      label: "Applications",
      icon: "applications",
      href: "/applications",
    },
    {
      label: "Access",
      icon: "access",
      items: [
        {
          label: "Users",
          href: "/users",
        },
        {
          label: "Invites",
          href: "/users/invites",
        },
      ],
    },
  ] satisfies NavItem[],
};
