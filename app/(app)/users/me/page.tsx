import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { MyAccountCard } from "./_components/my-account-card";
import { MyMemberCard } from "./_components/my-member-card";
import { MyProfileHeader } from "./_components/my-profile-header";
import { loadMyProfile } from "./_lib/load-my-profile";

import { MemberContactCard } from "@/app/(app)/members/[id]/_components/member-contact-card";
import { MemberGroupsCard } from "@/app/(app)/members/[id]/_components/member-groups-card";
import { SavedToast } from "@/components/saved-toast";
import { can, canManageLinks } from "@/lib/auth/permissions";
import { getChurchContext } from "@/lib/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("MyProfilePage");

  return { title: t("title") };
}

// For every role that can sign in; editing the member needs `ownProfile: update`. No loadUser(): it sends non-admins away.
export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const tSaved = await getTranslations("SavedToast");
  const { user, permissions, member, access, leadIds } = await loadMyProfile();

  if (!member) {
    const { church } = await getChurchContext();

    return (
      <>
        <MyProfileHeader member={null} user={user} />
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MyAccountCard stacked user={user} />
          <MyMemberCard
            canLink={canManageLinks(permissions)}
            churchName={church.name}
            userId={user.id}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <MyProfileHeader member={member} user={user} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <MemberContactCard
          canEdit={can(permissions, { ownProfile: ["update"] })}
          member={member}
          variant="self"
        />
        <div className="flex min-w-0 flex-col gap-5">
          <MemberGroupsCard
            canOpen={(group) =>
              access === "full" ||
              (access === "scoped" && leadIds.has(group.smallGroupId))
            }
            smallGroups={member.smallGroups}
            variant="self"
          />
          <MyAccountCard user={user} />
        </div>
      </div>
      {saved === "updated" && <SavedToast message={tSaved("updated")} />}
    </>
  );
}
