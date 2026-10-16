import { getTranslations } from "next-intl/server";

import { MemberAccountCard } from "./_components/member-account-card";
import { MemberContactCard } from "./_components/member-contact-card";
import { MemberDetailHeader } from "./_components/member-detail-header";
import { MemberGroupsCard } from "./_components/member-groups-card";

import { loadMember } from "@/app/(app)/members/_lib/load-member";
import { loadMemberAccount } from "@/app/(app)/members/_lib/load-member-account";
import { SavedToast } from "@/components/saved-toast";
import { requirePermission } from "@/lib/auth/get-permissions";

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requirePermission({ members: ["view"] });

  const [{ id }, { saved }, t, tForm] = await Promise.all([
    params,
    searchParams,
    getTranslations("SavedToast"),
    getTranslations("MemberForm"),
  ]);
  const member = await loadMember(id);
  const account = await loadMemberAccount(member);

  return (
    <>
      <MemberDetailHeader member={member} status={account.status} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <MemberContactCard member={member} />
        <div className="flex min-w-0 flex-col gap-5">
          <MemberGroupsCard smallGroups={member.smallGroups} />
          {account.canManage && (
            <MemberAccountCard account={account} member={member} />
          )}
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
