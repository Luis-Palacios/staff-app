import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CloseGroupCard } from "./_components/close-group-card";
import { GroupDetailHeader } from "./_components/group-detail-header";
import { GroupDetailsCard } from "./_components/group-details-card";
import { GroupMembersCard } from "./_components/group-members-card";

import { loadGroup } from "@/app/(app)/groups/_lib/load-group";
import { SavedToast } from "@/components/saved-toast";
import { getCurrentSmallGroupAccess } from "@/lib/auth/small-group-access";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  if ((await getCurrentSmallGroupAccess()) === "none") notFound();

  const [{ id }, { saved }, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("GroupSavedToast"),
  ]);
  const group = await loadGroup(id);

  return (
    <>
      <GroupDetailHeader group={group} />
      <div className="flex flex-wrap items-start gap-5">
        <GroupMembersCard group={group} />
        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-5">
          <GroupDetailsCard group={group} />
          {!group.closedAt && <CloseGroupCard group={group} />}
        </div>
      </div>
      {(saved === "created" || saved === "updated" || saved === "closed") && (
        <SavedToast message={t(saved)} />
      )}
    </>
  );
}
