import { redirect } from "next/navigation";

import { StaffDashboard } from "../../_components/staff-dashboard";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function StaffDashboardPage() {
  // Dashboard ▸ Staff is for roles with `smallGroups: all`; its sections check their own data.
  await requirePermission({ smallGroups: ["all"] });

  const session = await getServerSession();

  // The (app) layout already redirects without a session; this narrows the type.
  if (!session) redirect("/sign-in");

  return (
    <StaffDashboard
      firstName={session.user.name.trim().split(/\s+/)[0] ?? ""}
    />
  );
}
