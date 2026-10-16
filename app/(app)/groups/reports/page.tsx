import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { NewReportLink } from "./_components/new-report-link";
import ReportsList from "./_components/reports-list";
import ReportsListSkeleton from "./_components/reports-list-skeleton";
import { parseReportFilters } from "./_lib/report-filters";

import { getMe } from "@/api/members-api/client";
import { SavedToast } from "@/components/saved-toast";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";
import { getPermissions } from "@/lib/auth/get-permissions";
import { reportAccess } from "@/lib/auth/permissions";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, me, permissions, t] = await Promise.all([
    searchParams,
    getMe(),
    getPermissions(),
    getTranslations("ReportsPage"),
  ]);
  const { access, canSubmit } = reportAccess(permissions, me);

  // No access to groups: the shared 404 instead of a 403 from the API.
  if (access === "none") notFound();

  const scoped = access === "scoped";
  const filters = parseReportFilters(params);
  const tList = await getTranslations("ReportsList");
  const tNoMeeting = await getTranslations("NoMeetingDialog");

  return (
    <>
      <StaffAppPageHeader
        // Hide what a role can't use; only a full role with no member sees it disabled (rule 5).
        actions={
          scoped && !canSubmit ? undefined : (
            <NewReportLink canSubmit={canSubmit} />
          )
        }
        breadcrumbs={[groupsBreadcrumb, groupsReportsBreadcrumb]}
        description={scoped ? t("myDescription") : t("description")}
        title={scoped ? t("myTitle") : t("title")}
      />
      {params.saved === "deleted" && <SavedToast message={tList("deleted")} />}
      {params.saved === "marked" && (
        <SavedToast message={tNoMeeting("markedToast")} />
      )}
      <section className="flex flex-col gap-4">
        {/* Filter changes run in a transition (see ReportsBrowser), so the skeleton is first load only. */}
        <Suspense fallback={<ReportsListSkeleton />}>
          <ReportsList
            canSubmit={canSubmit}
            filters={filters}
            scoped={scoped}
          />
        </Suspense>
      </section>
    </>
  );
}
