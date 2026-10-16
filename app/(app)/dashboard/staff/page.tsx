import { redirect } from "next/navigation";

import { StaffDashboard } from "../../_components/staff-dashboard";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { getSmallGroupAccess } from "@/lib/auth/permissions";

export default async function StaffDashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Dashboard ▸ Staff is for admins and elders; everyone else has a single Dashboard at `/`.
  if (getSmallGroupAccess(session.permissions) !== "full") {
    redirect("/");
  }

  return (
    <StaffDashboard
      firstName={session.user.name.trim().split(/\s+/)[0] ?? ""}
    />
  );
}
