import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { Greeting, TodayDate } from "./dashboard-greeting";
import { MyGroupsSection } from "./leader-dashboard";
import { NoGroupsCard } from "./no-groups-card";

import { listSmallGroups } from "@/api/small-groups-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { settle } from "@/lib/settle";

/**
 * Dashboard ▸ Groups for admins and elders: the greeting, then the groups blocks. Each block
 * awaits its own promise in its own Suspense boundary, so one failing call doesn't take the rest
 * of the page down.
 */
export async function GroupsDashboard({ firstName }: { firstName: string }) {
  const [t, tDash] = await Promise.all([
    getTranslations("GroupsDashboard"),
    getTranslations("DashboardPage"),
  ]);
  const groups = settle(listSmallGroups());

  return (
    <>
      <StaffAppPageHeader
        description={t("description")}
        eyebrow={<TodayDate />}
        title={
          <Greeting
            firstName={firstName}
            salutations={{
              morning: tDash("morning"),
              afternoon: tDash("afternoon"),
              evening: tDash("evening"),
            }}
          />
        }
      />

      <div className="flex flex-col gap-7">
        <Suspense fallback={null}>
          <NoGroupsCard groups={groups} />
        </Suspense>
        <Suspense fallback={null}>
          <MyGroupsSection ledOnly />
        </Suspense>
      </div>
    </>
  );
}
