import { UserGroupIcon } from "@heroicons/react/24/outline";

import { EmptyState } from "@/components/empty-state";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb } from "@/config/breadcrumbs";

export default function GroupsPage() {
  return (
    <>
      <StaffAppPageHeader breadcrumbs={[groupsBreadcrumb]} title="Groups" />
      <EmptyState icon={UserGroupIcon} title="No groups yet">
        Small groups, their leaders and weekly reports will show up here once
        they&apos;re set up.
      </EmptyState>
    </>
  );
}
