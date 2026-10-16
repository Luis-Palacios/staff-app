import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { InviteStaffLink } from "./_components/invite-staff-link";
import UsersList from "./_components/users-list";
import UsersListSkeleton from "./_components/users-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { can } from "@/lib/auth/permissions";

export default async function UsersPage() {
  const t = await getTranslations("UsersPage");
  const tNav = await getTranslations("Nav");
  const session = await getServerSession();

  if (!session || !can(session.permissions, { user: ["list"] })) {
    redirect("/");
  }

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
