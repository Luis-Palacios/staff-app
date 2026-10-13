import { getTranslations } from "next-intl/server";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { membersBreadcrumb } from "@/config/breadcrumbs";

export default async function MembersPage() {
  const t = await getTranslations("MembersPage");

  return (
    <StaffAppPageHeader
      breadcrumbs={[membersBreadcrumb]}
      description={t("description")}
      title={t("title")}
    />
  );
}
