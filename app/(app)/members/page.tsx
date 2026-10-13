import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AddMemberLink } from "./_components/add-member-link";
import MembersList from "./_components/members-list";
import MembersListSkeleton from "./_components/members-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { membersBreadcrumb } from "@/config/breadcrumbs";

export default async function MembersPage() {
  const t = await getTranslations("MembersPage");

  return (
    <>
      <StaffAppPageHeader
        actions={<AddMemberLink variant="primary" />}
        breadcrumbs={[membersBreadcrumb]}
        description={t("description")}
        title={t("title")}
      />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<MembersListSkeleton />}>
          <MembersList />
        </Suspense>
      </section>
    </>
  );
}
