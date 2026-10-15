import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import GroupsList from "./_components/groups-list";
import GroupsListSkeleton from "./_components/groups-list-skeleton";
import { NewGroupLink } from "./_components/new-group-link";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb } from "@/config/breadcrumbs";

export default async function GroupsPage() {
  const t = await getTranslations("GroupsPage");

  return (
    <>
      <StaffAppPageHeader
        actions={<NewGroupLink variant="primary" />}
        breadcrumbs={[groupsBreadcrumb]}
        description={t("description")}
        title={t("title")}
      />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<GroupsListSkeleton />}>
          <GroupsList />
        </Suspense>
      </section>
    </>
  );
}
