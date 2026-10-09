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
        description="Testimonies from people preparing to become members. Open one to read it and see their journey so far."
        title="Membership applications"
      />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<MembershipApplicationsListSkeleton />}>
          <MembershipApplicationsList />
        </Suspense>
      </section>
    </>
  );
}
