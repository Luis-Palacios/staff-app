import { getTranslations } from "next-intl/server";

import { GroupForm } from "../_components/group-form";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function NewGroupPage() {
  await requirePermission({ smallGroups: ["create"] });

  const [t, tLink] = await Promise.all([
    getTranslations("GroupFormPage"),
    getTranslations("NewGroupLink"),
  ]);

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          groupsBreadcrumb,
          { label: tLink("label"), href: "/groups/new" },
        ]}
        description={t("newDescription")}
        title={t("newTitle")}
      />
      <GroupForm cancelHref="/groups" />
    </>
  );
}
