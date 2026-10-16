import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { GroupForm } from "../../_components/group-form";

import { loadGroup } from "@/app/(app)/groups/_lib/load-group";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { groupsBreadcrumb } from "@/config/breadcrumbs";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission({ smallGroups: ["view", "update"] });

  const { id } = await params;
  const [group, t] = await Promise.all([
    loadGroup(id),
    getTranslations("GroupFormPage"),
  ]);

  // Closed groups are read-only (the API would answer 409 anyway).
  if (group.closedAt) redirect(`/groups/${id}`);

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          groupsBreadcrumb,
          { label: group.name, href: `/groups/${id}` },
          { label: t("editCrumb"), href: `/groups/${id}/edit` },
        ]}
        description={t("editDescription")}
        title={t("editTitle")}
      />
      <GroupForm
        cancelHref={`/groups/${id}`}
        groupId={id}
        initial={{
          name: group.name,
          meetingDay: group.meetingDay,
          meetingAddress: group.meetingAddress ?? "",
        }}
      />
    </>
  );
}
