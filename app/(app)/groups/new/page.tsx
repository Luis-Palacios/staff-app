import { getTranslations } from "next-intl/server";

import { GroupForm } from "../_components/group-form";

import { getFeatures } from "@/api/members-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function NewGroupPage() {
  await requirePermission({ smallGroups: ["create"] });

  const [t, tLink, { guestGroups }] = await Promise.all([
    getTranslations("GroupFormPage"),
    getTranslations("NewGroupLink"),
    getFeatures(),
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
      <GroupForm askAudience={guestGroups} cancelHref="/groups" />
    </>
  );
}
