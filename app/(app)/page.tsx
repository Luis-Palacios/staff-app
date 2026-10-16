import { redirect } from "next/navigation";

import { GroupsDashboard } from "./_components/groups-dashboard";
import { LeaderDashboard } from "./_components/leader-dashboard";
import { WelcomeDashboard } from "./_components/welcome-dashboard";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { getSmallGroupAccess } from "@/lib/auth/permissions";

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

  // Roles with `smallGroups: all` land on Dashboard ▸ Groups; the staff dashboard is
  // /dashboard/staff.
  if (access === "full") {
    return (
      <GroupsDashboard firstName={firstName} week={(await searchParams).week} />
    );
  }

  // No small group permissions (a plain `user`): a greeting and the way to My profile.
  return <WelcomeDashboard firstName={firstName} />;
}
