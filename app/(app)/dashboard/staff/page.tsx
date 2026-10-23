import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { StaffDashboard } from "../../_components/staff-dashboard";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { requirePermission } from "@/lib/auth/get-permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Nav");

  return { title: t("dashboardApplicationsAccess") };
}

export default async function StaffDashboardPage() {
  // Dashboard ▸ Applications & access is for roles with `smallGroups: all`; its sections check their own data.
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
