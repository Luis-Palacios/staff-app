import type { StaffAppBreadcrumbItem } from "@/components/staff-app-breadcrumbs";

import { DocumentTextIcon, UserGroupIcon } from "@heroicons/react/24/solid";

export const groupsBreadcrumb: StaffAppBreadcrumbItem = {
  label: "Groups",
  href: "/groups",
  icon: UserGroupIcon,
};

export const groupsReportsBreadcrumb: StaffAppBreadcrumbItem = {
  label: "Reports",
  href: "/groups/reports",
};

export const applicationsBreadcrumb: StaffAppBreadcrumbItem = {
  label: "Applications",
  href: "/applications",
  icon: DocumentTextIcon,
};

export const usersBreadcrumb: StaffAppBreadcrumbItem = {
  label: "Users",
  href: "/users",
  icon: UserGroupIcon,
};
