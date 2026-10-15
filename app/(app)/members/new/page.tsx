import { getTranslations } from "next-intl/server";

import { MemberForm } from "../_components/member-form";

import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { membersBreadcrumb } from "@/config/breadcrumbs";
import { canManageLinks } from "@/lib/auth/roles";

export default async function NewMemberPage() {
  const [t, tLink, { user }] = await Promise.all([
    getTranslations("MemberFormPage"),
    getTranslations("AddMemberLink"),
    requireStaffSession(),
  ]);

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          membersBreadcrumb,
          { label: tLink("label"), href: "/members/new" },
        ]}
        description={t("newDescription")}
        title={t("newTitle")}
      />
      <MemberForm canInvite={canManageLinks(user.role)} cancelHref="/members" />
    </>
  );
}
