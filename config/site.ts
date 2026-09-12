import type { ComponentType, SVGProps } from "react";

import { UserGroupIcon } from "@heroicons/react/24/solid";

export type SiteConfig = typeof siteConfig;

/** A Heroicons (or otherwise compatible) SVG icon component. */
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** Icon keys resolved by the sidebar's icon registry (`components/sidebar.tsx`). */
export type NavIconName =
  | "dashboard"
  | "groups"
  | "applications"
  | "reports"
  | "balances";

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

export const siteConfig = {
  name: "Staff App",
  description: "Manage staff, groups, applications, and reports efficiently.",
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
      label: "Users",
      icon: UserGroupIcon,
      href: "/users",
    },
  ] satisfies NavItem[],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
