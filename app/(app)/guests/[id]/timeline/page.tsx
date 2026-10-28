import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getGuestTimeline } from "@/api/guests-api/client";
import { getMe } from "@/api/members-api/client";
import { GuestDetailHeader } from "@/app/(app)/guests/[id]/_components/guest-detail-header";
import { loadGuest } from "@/app/(app)/guests/_lib/load-guest";
import { requireGuests } from "@/app/(app)/guests/_lib/require-guests";
import { PersonTabs } from "@/components/person-tabs";
import { TimelineCard } from "@/components/report-timeline/timeline-card";
import { getPermissions } from "@/lib/auth/get-permissions";
import {
  can,
  getSmallGroupAccess,
  timelineViewer,
} from "@/lib/auth/permissions";

// The Timeline tab of a guest (rule 19): same access and header as the Profile.
export default async function GuestTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireGuests({ guests: ["view"] });

  const [{ id }, permissions, me] = await Promise.all([
    params,
    getPermissions(),
    getMe(),
  ]);
  const guest = await loadGuest(id);
  const timeline = await getGuestTimeline(id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();

    throw error;
  });
  const ledIds = new Set(me.leads.map((lead) => lead.smallGroupId));
  const groupId = guest.currentGroup?.id;
  const canOpenGroup =
    groupId !== undefined &&
    (getSmallGroupAccess(permissions) === "full" || ledIds.has(groupId));

  return (
    <>
      <GuestDetailHeader
        canEdit={can(permissions, { guests: ["update"] })}
        canList={can(permissions, { guests: ["view", "all"] })}
        groupHref={canOpenGroup ? `/groups/${groupId}` : null}
        guest={guest}
      />
      <PersonTabs
        basePath={`/guests/${guest.id}`}
        current="timeline"
        name={guest.name}
      />
      <TimelineCard timeline={timeline} viewer={timelineViewer(permissions)} />
    </>
  );
}
