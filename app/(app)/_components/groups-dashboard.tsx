import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { parseWeekParam } from "../_lib/week-param";

import { Greeting, TodayDate } from "./dashboard-greeting";
import { MyGroupsSection } from "./leader-dashboard";
import { NeedsFollowUpCard } from "./needs-follow-up-card";
import { ReportWeekSection } from "./report-week/report-week-section";
import { ReportWeekSkeleton } from "./report-week/report-week-skeleton";
import { WaitingForReplyCard } from "./waiting-for-reply-card";

import {
  getSmallGroupReportSummary,
  getSmallGroupReportWeek,
} from "@/api/small-groups-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { getChurchToday } from "@/lib/church-time";
import { settle } from "@/lib/settle";

/**
 * Dashboard ▸ Report status for admins and elders: the greeting, then the week and My groups. Each
 * block awaits its own promise in its own Suspense boundary, so one failing call doesn't take
 * the rest of the page down.
 */
export async function GroupsDashboard({
  firstName,
  week,
}: {
  firstName: string;
  /** The raw `?week=` value. */
  week: string | string[] | undefined;
}) {
  const [t, tDash] = await Promise.all([
    getTranslations("GroupsDashboard"),
    getTranslations("DashboardPage"),
  ]);
  const today = getChurchToday();
  const requestedSunday = parseWeekParam(week, today);
  const reportWeek = settle(
    getSmallGroupReportWeek(requestedSunday ?? undefined),
  );
  // The same cached call My groups makes, so the page asks for the summary once.
  const summary = settle(getSmallGroupReportSummary());

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

      <Suspense fallback={null}>
        <WaitingForReplyCard />
      </Suspense>

      <div className="flex flex-col gap-7">
        <Suspense fallback={null}>
          <NeedsFollowUpCard summary={summary} week={reportWeek} />
        </Suspense>
        <Suspense
          key={requestedSunday ?? "current"}
          fallback={<ReportWeekSkeleton />}
        >
          <ReportWeekSection
            requestedSunday={requestedSunday}
            today={today}
            week={reportWeek}
          />
        </Suspense>
        <Suspense fallback={null}>
          <MyGroupsSection ledOnly />
        </Suspense>
      </div>
    </>
  );
}
