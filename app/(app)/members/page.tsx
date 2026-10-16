import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { AddMemberLink } from "./_components/add-member-link";
import MembersList from "./_components/members-list";
import MembersListSkeleton from "./_components/members-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { membersBreadcrumb } from "@/config/breadcrumbs";
import { hasPermission, requirePermission } from "@/lib/auth/get-permissions";

export default async function MembersPage() {
  await requirePermission({ members: ["view", "all"] });

  const t = await getTranslations("MembersPage");

  return (
    <>
      <StaffAppPageHeader
        actions={
          (await hasPermission({ members: ["create"] })) ? (
            <AddMemberLink variant="primary" />
          ) : undefined
        }
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
