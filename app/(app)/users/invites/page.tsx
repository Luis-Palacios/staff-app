import { Suspense } from "react";
import { redirect } from "next/navigation";

import InvitesList from "./_components/invites-list";
import InvitesListSkeleton from "./_components/invites-list-skeleton";
import { NewInviteForm } from "./_components/new-invite-form";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { STAFF_ADMIN_ROLES } from "@/lib/auth/roles";

export default async function InvitesPage() {
  const session = await getServerSession();

  // TEMPORARY: hardcoded role check, kept only because auth-server's /api/custom-auth/invites
  // 403s for any role other than admin/elder (see statements.ts) — without this the page would
  // render and then fail fetching data. Replace with the real role→permission model designed in
  // Phase 9 (role-based nav & route gating) once that phase exists; don't build this out further
  // (no requireRole() helper, no other pages copying this check) until then.
  if (!session || !STAFF_ADMIN_ROLES.includes(session.user.role)) {
    redirect("/");
  }

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          usersBreadcrumb,
          { label: "Invites", href: "/users/invites" },
        ]}
        title="Invites"
      />
      <section className="flex flex-col gap-4">
        <NewInviteForm />
        <Suspense fallback={<InvitesListSkeleton />}>
          <InvitesList currentUserId={session.user.id} />
        </Suspense>
      </section>
    </>
  );
}
