import { getTranslations } from "next-intl/server";

import { MemberForm } from "../../_components/member-form";

import { loadMember } from "@/app/(app)/members/_lib/load-member";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { membersBreadcrumb } from "@/config/breadcrumbs";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [member, t] = await Promise.all([
    loadMember(id),
    getTranslations("MemberFormPage"),
  ]);
  const firstName = member.name.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          membersBreadcrumb,
          { label: member.name, href: `/members/${id}` },
          { label: t("editCrumb"), href: `/members/${id}/edit` },
        ]}
        description={t("editDescription", { firstName })}
        title={t("editTitle")}
      />
      <MemberForm
        cancelHref={`/members/${id}`}
        initial={{
          name: member.name,
          email: member.email ?? "",
          phone: member.phone ?? "",
          address: member.address ?? "",
          birthDate: member.birthDate ?? "",
        }}
        memberId={id}
      />
    </>
  );
}
