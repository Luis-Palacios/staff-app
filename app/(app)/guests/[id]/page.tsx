import { getTranslations } from "next-intl/server";

import { GuestContactCard } from "./_components/guest-contact-card";
import { GuestDetailHeader } from "./_components/guest-detail-header";
import { GuestGroupsCard } from "./_components/guest-groups-card";
import { GuestMeetingsCard } from "./_components/guest-meetings-card";
import { GuestOriginCard } from "./_components/guest-origin-card";

import { getMe } from "@/api/members-api/client";
import { loadGuest } from "@/app/(app)/guests/_lib/load-guest";
import { requireGuests } from "@/app/(app)/guests/_lib/require-guests";
import { SavedToast } from "@/components/saved-toast";
import { getPermissions } from "@/lib/auth/get-permissions";
import { can, getSmallGroupAccess } from "@/lib/auth/permissions";

export default async function GuestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireGuests({ guests: ["view"] });

  const [{ id }, { saved }, t, permissions, me] = await Promise.all([
    params,
    searchParams,
    getTranslations("GuestSavedToast"),
    getPermissions(),
    getMe(),
  ]);
  const guest = await loadGuest(id);
  // The group links go only where the viewer can open the group: any group with full access,
  // otherwise the groups they lead (the rest would 404).
  const ledIds = new Set(me.leads.map((lead) => lead.smallGroupId));
  const canOpenGroup = (groupId: number) =>
    getSmallGroupAccess(permissions) === "full" || ledIds.has(groupId);
  const canEdit = can(permissions, { guests: ["update"] });
  const groupId = guest.currentGroup?.id;

  return (
    <>
      <GuestDetailHeader
        canEdit={canEdit}
        canList={can(permissions, { guests: ["view", "all"] })}
        groupHref={
          groupId !== undefined && canOpenGroup(groupId)
            ? `/groups/${groupId}`
            : null
        }
        guest={guest}
      />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <GuestContactCard canEdit={canEdit} guest={guest} />
          <GuestOriginCard
            canViewMembers={can(permissions, { members: ["view"] })}
            guest={guest}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <GuestGroupsCard canOpen={canOpenGroup} guest={guest} />
          <GuestMeetingsCard
            canOpenReport={can(permissions, { smallGroupReports: ["view"] })}
            guest={guest}
          />
        </div>
      </div>
      {(saved === "created" || saved === "updated") && (
        <SavedToast message={t(saved)} />
      )}
    </>
  );
}
