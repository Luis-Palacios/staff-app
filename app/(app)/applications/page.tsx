import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import MembershipApplicationsList from "./_components/membership-applications-list";
import MembershipApplicationsListSkeleton from "./_components/membership-applications-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { applicationsBreadcrumb } from "@/config/breadcrumbs";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function ApplicationsPage() {
  await requirePermission({ membershipApplications: ["view"] });

  const t = await getTranslations("ApplicationsPage");

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[applicationsBreadcrumb]}
        description={t("description")}
        title={t("title")}
      />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<MembershipApplicationsListSkeleton />}>
          <MembershipApplicationsList />
        </Suspense>
      </section>
    </>
  );
}
