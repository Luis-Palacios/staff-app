import { getTranslations } from "next-intl/server";

import { TodayDate } from "./dashboard-greeting";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";

/**
 * Dashboard ▸ Prayer & follow-up: the week's prayer requests, praise and follow-up items from
 * every group's report, or from a leader's own groups (`scoped`).
 */
export async function PrayerDashboard({ scoped }: { scoped: boolean }) {
  const t = await getTranslations("PrayerDashboard");

  return (
    <StaffAppPageHeader
      description={scoped ? t("subtitleLeader") : t("subtitle")}
      eyebrow={<TodayDate />}
      title={t("title")}
    />
  );
}
