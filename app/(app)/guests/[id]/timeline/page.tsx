import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getGuestTimeline } from "@/api/guests-api/client";
import { getMe } from "@/api/members-api/client";
import { GuestDetailHeader } from "@/app/(app)/guests/[id]/_components/guest-detail-header";
import { loadGuest } from "@/app/(app)/guests/_lib/load-guest";
import { requireGuests } from "@/app/(app)/guests/_lib/require-guests";
import { PersonTabs } from "@/components/person-tabs";
import { TimelineCard } from "@/components/report-timeline/timeline-card";
import { getChurchToday } from "@/lib/church-time";
import { getPermissions } from "@/lib/auth/get-permissions";
import {
  can,
  getSmallGroupAccess,
  openGroupsOf,
  timelineViewer,
} from "@/lib/auth/permissions";
import { parseTimelineQuery, toTimelineParams } from "@/lib/timeline-range";

// The Timeline tab of a guest (rule 19): same access and header as the Profile.
export default async function GuestTimelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireGuests({ guests: ["view"] });

  const [{ id }, search, permissions, me] = await Promise.all([
    params,
    searchParams,
    getPermissions(),
    getMe(),
  ]);
  const today = getChurchToday();
  const query = parseTimelineQuery(search, today);
  const guest = await loadGuest(id);
  const timeline = await getGuestTimeline(id, toTimelineParams(query)).catch(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();

      throw error;
    },
  );
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
      <TimelineCard
        firstVisitDate={guest.firstVisitDate}
        kind="guest"
        openGroups={openGroupsOf(permissions, me.leads)}
        query={query}
        timeline={timeline}
        today={today}
        viewer={timelineViewer(permissions)}
      />
    </>
  );
}
