import { Suspense } from "react";

import MembershipApplicationsList from "./_components/membership-applications-list";
import MembershipApplicationsListSkeleton from "./_components/membership-applications-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { applicationsBreadcrumb } from "@/config/breadcrumbs";

export default async function ApplicationsPage() {
  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[applicationsBreadcrumb]}
        title="Membership Applications"
      />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<MembershipApplicationsListSkeleton />}>
          <MembershipApplicationsList />
        </Suspense>
      </section>
    </>
  );
}
