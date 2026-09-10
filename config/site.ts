export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Staff App",
  description: "Manage staff, groups, applications, and reports efficiently.",
  navItems: [
    {
      label: "Dashboard",
      href: "/",
    },
    {
      label: "Groups",
      href: "/groups",
    },
    {
      label: "Applications",
      href: "/applications",
    },
    {
      label: "Reports",
      href: "/reports",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/",
    },
    {
      label: "Groups",
      href: "/groups",
    },
    {
      label: "Applications",
      href: "/applications",
    },
    {
      label: "Reports",
      href: "/reports",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
