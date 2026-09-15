import { AppShell } from "@/components/app-shell";
import { siteConfig } from "@/config/site";
import { getServerSession } from "@/lib/get-session";
import { getVisibleNavItems, parseRole } from "@/lib/permissions";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const role = parseRole(session?.user.role);
  const navItems = getVisibleNavItems(siteConfig.navItems, role);

  return <AppShell navItems={navItems}>{children}</AppShell>;
}
