import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { GroupsDashboard } from "./_components/groups-dashboard";
import { LeaderDashboard } from "./_components/leader-dashboard";
import { WelcomeDashboard } from "./_components/welcome-dashboard";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { getPermissions } from "@/lib/auth/get-permissions";
import { getSmallGroupAccess } from "@/lib/auth/permissions";

// The tab title follows the nav label of the dashboard this role lands on. Reading the session here
// costs an extra /get-session whenever a <Link> prefetches this route, and that counts against
// auth-server's rate limit, so links to "/" that show inside the shell set prefetch={false}.
export async function generateMetadata(): Promise<Metadata> {
  const [t, permissions] = await Promise.all([
    getTranslations("Nav"),
    getPermissions(),
  ]);
  const titles = {
    full: t("dashboardReportStatus"),
    scoped: t("dashboardMyGroups"),
    none: t("dashboard"),
  };

  return { title: titles[getSmallGroupAccess(permissions)] };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[] }>;
}) {
  const session = await getServerSession();

  // The (app) layout already redirects without a session; this narrows the type.
  if (!session) {
    redirect("/sign-in");
  }

  const firstName = session.user.name.trim().split(/\s+/)[0] ?? "";
  const access = getSmallGroupAccess(session.permissions);

  // `smallGroups: view` without `all`: their own dashboard, their groups and what's left to file.
  if (access === "scoped") {
    return <LeaderDashboard firstName={firstName} />;
  }

  // Roles with `smallGroups: all` land on Dashboard ▸ Report status; the staff dashboard is
  // /dashboard/staff.
  if (access === "full") {
    return (
      <GroupsDashboard firstName={firstName} week={(await searchParams).week} />
    );
  }

  // No small group permissions (a plain `user`): a greeting and the way to My profile.
  return <WelcomeDashboard firstName={firstName} />;
}
