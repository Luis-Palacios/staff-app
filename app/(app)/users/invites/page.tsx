import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import InvitesList from "./_components/invites-list";
import InvitesListSkeleton from "./_components/invites-list-skeleton";
import { NewInviteForm } from "./_components/new-invite-form";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";
import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function InvitesPage() {
  await requirePermission({ invites: ["create"] });

  const t = await getTranslations("InvitesPage");
  const tNav = await getTranslations("Nav");
  const { user } = await requireStaffSession();

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          usersBreadcrumb,
          { label: tNav("invites"), href: "/users/invites" },
        ]}
        description={t("description")}
        title={tNav("invites")}
      />
      <section className="flex flex-col gap-4">
        <NewInviteForm />
        <Suspense fallback={<InvitesListSkeleton />}>
          <InvitesList currentUserId={user.id} />
        </Suspense>
      </section>
    </>
  );
}
