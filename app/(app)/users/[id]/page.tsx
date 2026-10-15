import { getTranslations } from "next-intl/server";

import { UserAccountCard } from "./_components/user-account-card";
import { UserMemberCard } from "./_components/user-member-card";

import { loadUser } from "@/app/(app)/users/_lib/load-user";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ user, member }, t] = await Promise.all([
    loadUser(id),
    getTranslations("UserDetail"),
  ]);

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          usersBreadcrumb,
          { label: user.name, href: `/users/${user.id}` },
        ]}
        eyebrow={t("eyebrow")}
        title={user.name}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <UserAccountCard user={user} />
        <UserMemberCard member={member} user={user} />
      </div>
    </>
  );
}
