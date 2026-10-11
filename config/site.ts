import type { ComponentType, SVGProps } from "react";
import type { Messages } from "next-intl";

export type SiteConfig = typeof siteConfig;

/** A Heroicons (or otherwise compatible) SVG icon component. */
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

/** Icon keys resolved by the sidebar's icon registry (`components/sidebar.tsx`). */
export type NavIconName = "dashboard" | "groups" | "applications" | "access";

/** A key of the `Nav` namespace (messages/en.json). The sidebar and the
 *  breadcrumbs translate it, so config holds no display text. */
export type NavLabelKey = keyof Messages["Nav"];

export type NavChildItem = {
  labelKey: NavLabelKey;
  href: string;
};

export type NavItem = {
  labelKey: NavLabelKey;
  /** Either a registry key (`components/sidebar.tsx`) or an icon component directly. */
  icon: NavIconName | HeroIcon;
  /** Leaf link. Omit when the item only groups `items`. */
  href?: string;
  /** Nested links — renders the item as a collapsible group. */
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
      href: "/",
    },
    {
      labelKey: "groups",
      icon: "groups",
      items: [
        {
          labelKey: "groupsList",
          href: "/groups",
        },
        {
          labelKey: "groupsReports",
          href: "/groups/reports",
        },
      ],
    },
    {
      labelKey: "applications",
      icon: "applications",
      href: "/applications",
    },
    {
      labelKey: "access",
      icon: "access",
      items: [
        {
          labelKey: "users",
          href: "/users",
        },
        {
          labelKey: "invites",
          href: "/users/invites",
        },
      ],
    },
  ] satisfies NavItem[],
};
