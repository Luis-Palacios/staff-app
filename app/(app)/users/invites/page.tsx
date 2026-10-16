import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import InvitesList from "./_components/invites-list";
import InvitesListSkeleton from "./_components/invites-list-skeleton";
import { NewInviteForm } from "./_components/new-invite-form";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { can } from "@/lib/auth/permissions";

export default async function InvitesPage() {
  const t = await getTranslations("InvitesPage");
  const tNav = await getTranslations("Nav");
  const session = await getServerSession();

  if (!session || !can(session.permissions, { invites: ["create"] })) {
    redirect("/");
  }

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
          <InvitesList currentUserId={session.user.id} />
        </Suspense>
      </section>
    </>
  );
}
