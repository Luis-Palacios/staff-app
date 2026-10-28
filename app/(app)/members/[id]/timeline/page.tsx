import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getMemberTimeline } from "@/api/members-api/client";
import { MemberDetailHeader } from "@/app/(app)/members/[id]/_components/member-detail-header";
import { loadMember } from "@/app/(app)/members/_lib/load-member";
import { loadMemberAccount } from "@/app/(app)/members/_lib/load-member-account";
import { PersonTabs } from "@/components/person-tabs";
import { TimelineCard } from "@/components/report-timeline/timeline-card";
import { getPermissions, requirePermission } from "@/lib/auth/get-permissions";
import { can, timelineViewer } from "@/lib/auth/permissions";

// The Timeline tab (rule 19): same access as the Profile, same header. A 404 from the timeline
// call is the page's own 404.
export default async function MemberTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission({ members: ["view"] });

  const [{ id }, permissions] = await Promise.all([params, getPermissions()]);
  const member = await loadMember(id);
  const [account, timeline] = await Promise.all([
    loadMemberAccount(member),
    getMemberTimeline(id).catch((error: unknown) => {
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
      <TimelineCard timeline={timeline} viewer={timelineViewer(permissions)} />
    </>
  );
}
