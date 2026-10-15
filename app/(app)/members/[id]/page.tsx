import { getTranslations } from "next-intl/server";

import { MemberContactCard } from "./_components/member-contact-card";
import { MemberDetailHeader } from "./_components/member-detail-header";
import { MemberGroupsCard } from "./_components/member-groups-card";

import { loadMember } from "@/app/(app)/members/_lib/load-member";
import { SavedToast } from "@/components/saved-toast";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("SavedToast"),
  ]);
  const member = await loadMember(id);

  return (
    <>
      <MemberDetailHeader member={member} />
      <div className="flex flex-wrap items-start gap-5">
        <MemberContactCard member={member} />
        <MemberGroupsCard smallGroups={member.smallGroups} />
      </div>
      {(saved === "created" || saved === "updated") && (
        <SavedToast message={t(saved)} />
      )}
    </>
  );
}
