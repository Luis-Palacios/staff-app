import { Suspense } from "react";
import { redirect } from "next/navigation";

import MembershipApplicationsList from "./_components/membership-applications-list";
import MembershipApplicationsListSkeleton from "./_components/membership-applications-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { applicationsBreadcrumb } from "@/config/breadcrumbs";
import { getServerSession } from "@/lib/get-session";
import { canView, parseRole } from "@/lib/permissions";

export default async function ApplicationsPage() {
  const session = await getServerSession();
  const role = parseRole(session?.user.role);

  if (!canView(role, "membershipApplications")) {
    redirect("/");
  }

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
