import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { InviteStaffLink } from "./_components/invite-staff-link";
import UsersList from "./_components/users-list";
import UsersListSkeleton from "./_components/users-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function UsersPage() {
  await requirePermission({ user: ["list"] });

  const t = await getTranslations("UsersPage");
  const tNav = await getTranslations("Nav");

  return (
    <>
      <StaffAppPageHeader
        actions={<InviteStaffLink />}
        breadcrumbs={[usersBreadcrumb]}
        description={t("description")}
        title={tNav("users")}
      />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<UsersListSkeleton />}>
          <UsersList />
        </Suspense>
      </section>
    </>
  );
}
