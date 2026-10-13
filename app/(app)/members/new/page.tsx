import { getTranslations } from "next-intl/server";

import { MemberForm } from "../_components/member-form";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { membersBreadcrumb } from "@/config/breadcrumbs";

export default async function NewMemberPage() {
  const [t, tLink] = await Promise.all([
    getTranslations("MemberFormPage"),
    getTranslations("AddMemberLink"),
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
      <MemberForm cancelHref="/members" />
    </>
  );
}
