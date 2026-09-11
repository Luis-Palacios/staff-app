import type { ReactNode } from "react";

import {
  StaffAppBreadcrumbs,
  type StaffAppBreadcrumbItem,
} from "@/components/staff-app-breadcrumbs";

export function StaffAppPageHeader({
  breadcrumbs,
  title,
}: {
  breadcrumbs: StaffAppBreadcrumbItem[];
  title: ReactNode;
}) {
  return (
    <>
      <StaffAppBreadcrumbs items={breadcrumbs} />
      <h2 className="mb-3 font-bold ml-2">{title}</h2>
    </>
  );
}
