import { MyAccountCard } from "./_components/my-account-card";
import { MyProfileHeader } from "./_components/my-profile-header";
import { loadMyProfile } from "./_lib/load-my-profile";

import { MemberContactCard } from "@/app/(app)/members/[id]/_components/member-contact-card";
import { MemberGroupsCard } from "@/app/(app)/members/[id]/_components/member-groups-card";

// Read-only, for every role that can sign in. No loadUser(): it sends non-admins away.
export default async function MyProfilePage() {
  const { user, member, access, leadIds } = await loadMyProfile();

  return (
    <>
      <MyProfileHeader member={member} user={user} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {member && <MemberContactCard member={member} variant="self" />}
        <div className="flex min-w-0 flex-col gap-5">
          {member && (
            <MemberGroupsCard
              canOpen={(group) =>
                access === "full" ||
                (access === "scoped" && leadIds.has(group.smallGroupId))
              }
              smallGroups={member.smallGroups}
              variant="self"
            />
          )}
          <MyAccountCard user={user} />
        </div>
      </div>
    </>
  );
}
