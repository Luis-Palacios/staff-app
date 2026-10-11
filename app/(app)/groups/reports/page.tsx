import { ChartBarIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/empty-state";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";

export default function ReportsPage() {
  const t = useTranslations("ReportsPage");
  const tNav = useTranslations("Nav");

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[groupsBreadcrumb, groupsReportsBreadcrumb]}
        title={tNav("groupsReports")}
      />
      <EmptyState icon={ChartBarIcon} title={t("emptyTitle")}>
        {t("emptyBody")}
      </EmptyState>
    </>
  );
}
