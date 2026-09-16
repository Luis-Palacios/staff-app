import { Suspense } from "react";
import { redirect } from "next/navigation";

import UsersList from "./_components/users-list";
import UsersListSkeleton from "./_components/users-list-skeleton";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";
import { getServerSession } from "@/lib/get-server-session";

export default async function UsersPage() {
  const session = await getServerSession();

  // TEMPORARY: hardcoded role check, kept only because auth-server's listUsers endpoint itself
  // 403s for any role other than admin/elder (see statements.ts) — without this the page would
  // render and then fail fetching data. Replace with the real role→permission model designed in
  // Phase 9 (role-based nav & route gating) once that phase exists; don't build this out further
  // (no requireRole() helper, no other pages copying this check) until then.
  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "elder")
  ) {
    redirect("/");
  }

  return (
    <>
      <StaffAppPageHeader breadcrumbs={[usersBreadcrumb]} title="Users" />
      <section className="flex flex-col gap-4">
        <Suspense fallback={<UsersListSkeleton />}>
          <UsersList />
        </Suspense>
      </section>
    </>
  );
}
