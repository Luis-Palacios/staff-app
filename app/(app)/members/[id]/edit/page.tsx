import { getTranslations } from "next-intl/server";

import { MemberForm } from "../../_components/member-form";

import { loadMember } from "@/app/(app)/members/_lib/load-member";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { membersBreadcrumb } from "@/config/breadcrumbs";
import { getPermissions, requirePermission } from "@/lib/auth/get-permissions";
import { can } from "@/lib/auth/permissions";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission({ members: ["update"] });

  const { id } = await params;
  const [member, t, permissions] = await Promise.all([
    loadMember(id),
    getTranslations("MemberFormPage"),
    getPermissions(),
  ]);
  const canEditEmail =
    can(permissions, { members: ["all"] }) || member.userId === null;
  const firstName = member.name.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          // Leaders have no Members list to go back to.
          ...(can(permissions, { members: ["view", "all"] })
            ? [membersBreadcrumb]
            : []),
          { label: member.name, href: `/members/${id}` },
          { label: t("editCrumb"), href: `/members/${id}/edit` },
        ]}
        description={t("editDescription", { firstName })}
        title={t("editTitle")}
      />
      <MemberForm
        // The email is what an invite is matched to a member on: without `members: all` it can
        // change only while the member has no user (rule 8).
        canEditEmail={canEditEmail}
        cancelHref={`/members/${id}`}
        emailLinked={member.userId !== null}
        initial={{
          name: member.name,
          email: member.email ?? "",
          phone: member.phone ?? "",
          address: member.address ?? "",
          birthDate: member.birthDate ?? "",
          sex: member.sex ?? "",
        }}
        memberId={id}
      />
    </>
  );
}
