import { Suspense } from "react";

import MembershipApplicationsList from "./_components/membership-applications-list";
import MembershipApplicationsListSkeleton from "./_components/membership-applications-list-skeleton";

import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";
import { applicationsBreadcrumb } from "@/config/breadcrumbs";

export default async function ApplicationsPage() {
  return (
    <>
      <StaffAppBreadcrumbs items={[applicationsBreadcrumb]} />
      <h2 className="mb-3 font-bold ml-2">Membership Applications</h2>
      <section className="flex flex-col gap-4">
        <Suspense fallback={<MembershipApplicationsListSkeleton />}>
          <MembershipApplicationsList />
        </Suspense>
      </section>
    </>
  );
}
