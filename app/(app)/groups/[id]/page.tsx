import { getTranslations } from "next-intl/server";

import { GroupDetailHeader } from "./_components/group-detail-header";
import { GroupDetailsCard } from "./_components/group-details-card";
import { GroupMembersCard } from "./_components/group-members-card";

import { loadGroup } from "@/app/(app)/groups/_lib/load-group";
import { SavedToast } from "@/components/saved-toast";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
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
        <GroupDetailsCard group={group} />
      </div>
      {(saved === "created" || saved === "updated") && (
        <SavedToast message={t(saved)} />
      )}
    </>
  );
}
