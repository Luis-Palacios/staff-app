import { UsersIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { AddMemberLink } from "./add-member-link";
import MembersBrowser from "./members-browser";

import { listInvites } from "@/api/auth-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { listMembers } from "@/api/members-api/client";
import { EmptyState } from "@/components/empty-state";
import { canManageLinks } from "@/lib/auth/permissions";
import { getAccountStatus, type AccountStatus } from "@/lib/members/account";

export default async function MembersList() {
  const [members, session] = await Promise.all([
    listMembers(),
    getServerSession(),
  ]);

  if (members.length === 0) {
    const t = await getTranslations("MembersEmpty");

    return (
      <EmptyState
        action={<AddMemberLink variant="empty" />}
        icon={UsersIcon}
        title={t("title")}
      >
        {t("description")}
      </EmptyState>
    );
  }

  // Only admins and elders can read the invite list, so only they get the Account column. One
  // call for the whole list, not one per row.
  let accounts: Record<number, AccountStatus> | undefined;

  if (canManageLinks(session?.permissions)) {
    const { invites } = await listInvites(
      (await headers()).get("cookie") ?? "",
    );

    accounts = Object.fromEntries(
      members.map((member) => [member.id, getAccountStatus(member, invites)]),
    );
  }

  return <MembersBrowser accounts={accounts} members={members} />;
}
