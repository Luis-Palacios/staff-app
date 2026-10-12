import { getTranslations } from "next-intl/server";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { usersBreadcrumb } from "@/config/breadcrumbs";

export default async function MyProfilePage() {
  const t = await getTranslations("MyProfilePage");
  const tMenu = await getTranslations("AccountMenu");

  // TODO: Get current user login id and fetch user profile data
  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          usersBreadcrumb,
          { label: tMenu("myProfile"), href: "/users/me" },
        ]}
        title={t("title")}
      />
    </>
  );
}
