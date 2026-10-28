import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getMe, getMemberTimeline } from "@/api/members-api/client";
import { MemberDetailHeader } from "@/app/(app)/members/[id]/_components/member-detail-header";
import { loadMember } from "@/app/(app)/members/_lib/load-member";
import { loadMemberAccount } from "@/app/(app)/members/_lib/load-member-account";
import { PersonTabs } from "@/components/person-tabs";
import { TimelineCard } from "@/components/report-timeline/timeline-card";
import { getChurchToday } from "@/lib/church-time";
import { getPermissions, requirePermission } from "@/lib/auth/get-permissions";
import { can, openGroupsOf, timelineViewer } from "@/lib/auth/permissions";
import { parseTimelineQuery, toTimelineParams } from "@/lib/timeline-range";

// The Timeline tab (rule 19): same access as the Profile, same header. A 404 from the timeline
// call is the page's own 404.
export default async function MemberTimelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission({ members: ["view"] });

  const [{ id }, search, permissions, me] = await Promise.all([
    params,
    searchParams,
    getPermissions(),
    getMe(),
  ]);
  const today = getChurchToday();
  const query = parseTimelineQuery(search, today);
  const member = await loadMember(id);
  const [account, timeline] = await Promise.all([
    loadMemberAccount(member),
    getMemberTimeline(id, toTimelineParams(query)).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) notFound();

      throw error;
    }),
  ]);

  return (
    <>
      <MemberDetailHeader
        canEdit={can(permissions, { members: ["update"] })}
        canListMembers={can(permissions, { members: ["view", "all"] })}
        canManage={account.canManage}
        member={member}
        status={account.status}
      />
      <PersonTabs
        basePath={`/members/${member.id}`}
        current="timeline"
        name={member.name}
      />
      <TimelineCard
        kind="member"
        openGroups={openGroupsOf(permissions, me.leads)}
        query={query}
        timeline={timeline}
        today={today}
        viewer={timelineViewer(permissions)}
      />
    </>
  );
}
