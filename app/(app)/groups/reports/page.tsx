import { ChartBarIcon } from "@heroicons/react/24/outline";

import { EmptyState } from "@/components/empty-state";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import {
  groupsBreadcrumb,
  groupsReportsBreadcrumb,
} from "@/config/breadcrumbs";

export default function ReportsPage() {
  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[groupsBreadcrumb, groupsReportsBreadcrumb]}
        title="Reports"
      />
      <EmptyState icon={ChartBarIcon} title="No reports yet">
        Weekly reports from group leaders will show up here once groups start
        submitting them.
      </EmptyState>
    </>
  );
}
