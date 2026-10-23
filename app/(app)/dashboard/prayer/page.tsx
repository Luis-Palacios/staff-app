import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { PrayerDashboard } from "../../_components/prayer-dashboard";

import { getPermissions } from "@/lib/auth/get-permissions";
import { getSmallGroupAccess } from "@/lib/auth/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PrayerDashboard");

  return { title: t("title") };
}

export default async function PrayerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    week?: string | string[];
    report?: string | string[];
    section?: string | string[];
  }>;
}) {
  // Full roles see every group, scoped roles their own; with no small group access there's no
  // nav item, so the URL goes back to their dashboard.
  const access = getSmallGroupAccess(await getPermissions());

  if (access === "none") redirect("/");

  const { week, report, section } = await searchParams;

  return (
    <PrayerDashboard
      report={report}
      scoped={access === "scoped"}
      section={section}
      week={week}
    />
  );
}
