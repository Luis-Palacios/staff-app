import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { loadMyProfile } from "../_lib/load-my-profile";

import { MemberForm } from "@/app/(app)/members/_components/member-form";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { can } from "@/lib/auth/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("MemberFormPage");

  return { title: t("ownEditTitle") };
}

// Edits the signed-in user's own member through `PATCH /me/member`. Never an id from the URL.
// Without `ownProfile: update`, or with no linked member, the page is a 404 (rule 2).
export default async function EditMyProfilePage() {
  const { permissions, member } = await loadMyProfile();

  if (!member || !can(permissions, { ownProfile: ["update"] })) notFound();

  const [t, tProfile] = await Promise.all([
    getTranslations("MemberFormPage"),
    getTranslations("MyProfilePage"),
  ]);

  return (
    <>
      <StaffAppPageHeader
        breadcrumbs={[
          { label: tProfile("title"), href: "/users/me" },
          { label: t("editCrumb"), href: "/users/me/edit" },
        ]}
        description={t("ownEditDescription")}
        title={t("ownEditTitle")}
      />
      <MemberForm
        // The email is what an invite matches on: only `members: all` changes it, never here.
        own
        canEditEmail={false}
        cancelHref="/users/me"
        initial={{
          name: member.name,
          email: member.email ?? "",
          phone: member.phone ?? "",
          address: member.address ?? "",
          birthDate: member.birthDate ?? "",
          sex: member.sex ?? "",
        }}
      />
    </>
  );
}
