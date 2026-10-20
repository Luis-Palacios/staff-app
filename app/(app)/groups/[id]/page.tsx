import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CloseGroupCard } from "./_components/close-group-card";
import { GroupDetailHeader } from "./_components/group-detail-header";
import { GroupDetailsCard } from "./_components/group-details-card";
import { GroupReportsCard } from "./_components/group-reports-card";
import { GroupMembersCard } from "./_components/group-members-card";

import { getMe } from "@/api/members-api/client";
import { loadGroup } from "@/app/(app)/groups/_lib/load-group";
import { SavedToast } from "@/components/saved-toast";
import { getChurchToday } from "@/lib/church-time";
import { getPermissions } from "@/lib/auth/get-permissions";
import { can, reportAccess } from "@/lib/auth/permissions";
import { getCurrentSmallGroupAccess } from "@/lib/auth/small-group-access";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const access = await getCurrentSmallGroupAccess();

  if (access === "none") notFound();

  const [{ id }, { saved }, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("GroupSavedToast"),
  ]);
  const group = await loadGroup(id);
  const me = await getMe();
  // Marks the caller's own row, which a scoped user can't change (rule 9). Full roles don't need it.
  const currentMemberId = access === "scoped" ? (me.member?.id ?? null) : null;
  // New report needs a linked member (rule 5); a closed group never takes one (rule 8).
  const permissions = await getPermissions();
  const { canSubmit } = reportAccess(permissions, me);

  return (
    <>
      <GroupDetailHeader group={group} />
      <div className="flex flex-wrap items-start gap-5">
        <GroupMembersCard
          access={access}
          currentMemberId={currentMemberId}
          group={group}
          today={getChurchToday()}
        />
        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-5">
          <GroupDetailsCard group={group} />
          <GroupReportsCard canSubmit={canSubmit} group={group} />
          {!group.closedAt && can(permissions, { smallGroups: ["close"] }) && (
            <CloseGroupCard group={group} />
          )}
        </div>
      </div>
      {(saved === "created" || saved === "updated" || saved === "closed") && (
        <SavedToast message={t(saved)} />
      )}
    </>
  );
}
