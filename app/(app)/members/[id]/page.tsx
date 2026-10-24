import { getTranslations } from "next-intl/server";

import { MemberAccountCard } from "./_components/member-account-card";
import { MemberContactCard } from "./_components/member-contact-card";
import { MemberDetailHeader } from "./_components/member-detail-header";
import { MemberGroupsCard } from "./_components/member-groups-card";
import { MemberInactiveBanner } from "./_components/member-inactive-banner";
import { MemberStatusHistoryCard } from "./_components/member-status-card";

import { getMe } from "@/api/members-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";
import { loadMember } from "@/app/(app)/members/_lib/load-member";
import { loadMemberAccount } from "@/app/(app)/members/_lib/load-member-account";
import { loadStatusHistory } from "@/app/(app)/members/_lib/load-status-history";
import { SavedToast } from "@/components/saved-toast";
import { getPermissions, requirePermission } from "@/lib/auth/get-permissions";
import {
  can,
  getSmallGroupAccess,
  userAccountAccess,
} from "@/lib/auth/permissions";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requirePermission({ members: ["view"] });

  const [permissions, me] = await Promise.all([getPermissions(), getMe()]);

  const [{ id }, { saved }, t, tForm] = await Promise.all([
    params,
    searchParams,
    getTranslations("SavedToast"),
    getTranslations("MemberForm"),
  ]);
  const member = await loadMember(id);
  const account = await loadMemberAccount(member);
  const inactive = member.status === "inactive";
  // Reasons, notes and history are private: only callers with `setStatus` get them (rule 5).
  const canSetStatus = can(permissions, { members: ["setStatus"] });
  const history = inactive && canSetStatus ? await loadStatusHistory(id) : null;
  const session = await getServerSession();
  const canTurnOffSignIn =
    !!account.user &&
    !!session &&
    userAccountAccess(permissions, session.user.id, account.user.id).ban;
  // Leader names come from the groups list; if it can't be read the card just omits them.
  const groups = await listSmallGroups().catch(() => []);
  const leaders = Object.fromEntries(
    groups.flatMap(({ id: groupId, leaderName }) =>
      leaderName === null ? [] : [[groupId, leaderName]],
    ),
  );
  // The group links go only where the viewer can open the group: any group with full access,
  // otherwise the groups they lead (the rest would 404).
  const ledIds = new Set(me.leads.map((lead) => lead.smallGroupId));
  const canOpenGroup = (group: { smallGroupId: number }) =>
    getSmallGroupAccess(permissions) === "full" ||
    ledIds.has(group.smallGroupId);

  return (
    <>
      <MemberDetailHeader
        canEdit={can(permissions, { members: ["update"] })}
        canListMembers={can(permissions, { members: ["view", "all"] })}
        canManage={account.canManage}
        member={member}
        status={account.status}
      />
      {inactive && <MemberInactiveBanner member={member} />}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <MemberContactCard
          canEdit={can(permissions, { members: ["update"] })}
          member={member}
        />
        <div className="flex min-w-0 flex-col gap-5">
          <MemberGroupsCard
            canOpen={canOpenGroup}
            leaders={leaders}
            pastGroups={inactive ? member.pastSmallGroups : undefined}
            smallGroups={member.smallGroups}
          />
          {account.canManage && (
            <MemberAccountCard
              account={account}
              canTurnOffSignIn={canTurnOffSignIn}
              member={member}
            />
          )}
          {history && <MemberStatusHistoryCard history={history} />}
        </div>
      </div>
      {(saved === "created" ||
        saved === "updated" ||
        saved === "createdInvited") && <SavedToast message={t(saved)} />}
      {saved === "inviteFailed" && (
        <SavedToast message={tForm("inviteFailed")} tone="danger" />
      )}
    </>
  );
}
