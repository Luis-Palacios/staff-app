import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { GroupForm } from "../_components/group-form";

import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { getCurrentSmallGroupAccess } from "@/lib/auth/small-group-access";

export default async function NewGroupPage() {
  // Only full roles create groups; the API would answer 403 for the rest.
  if ((await getCurrentSmallGroupAccess()) !== "full") notFound();

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
