import { UsersIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { AddMemberLink } from "./add-member-link";
import MembersBrowser from "./members-browser";

import { listInvites, listUsers } from "@/api/auth-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { listMembers } from "@/api/members-api/client";
import { EmptyState } from "@/components/empty-state";
import { can, canManageLinks } from "@/lib/auth/permissions";
import { getAccountStatus, type AccountStatus } from "@/lib/members/account";

export default async function MembersList() {
  const [members, session] = await Promise.all([
    listMembers("all"),
    getServerSession(),
  ]);

  if (members.length === 0) {
    const t = await getTranslations("MembersEmpty");

    return (
      <EmptyState
        action={
          can(session?.permissions, { members: ["create"] }) ? (
            <AddMemberLink variant="empty" />
          ) : undefined
        }
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
  let signInOff: number[] | undefined;

  if (canManageLinks(session?.permissions)) {
    const cookie = (await headers()).get("cookie") ?? "";
    const linkedInactive = members.filter(
      (member) => member.status === "inactive" && member.userId,
    );
    // Whether sign-in is off is the user's ban, which only the user list has. Skip the call when
    // there is no inactive member with a user.
    const [{ invites }, users] = await Promise.all([
      listInvites(cookie),
      linkedInactive.length > 0 ? listUsers(cookie) : { users: [] },
    ]);
    const bannedIds = new Set(
      users.users.filter((user) => user.banned).map((user) => user.id),
    );

    accounts = Object.fromEntries(
      members.map((member) => [member.id, getAccountStatus(member, invites)]),
    );
    signInOff = linkedInactive
      .filter((member) => bannedIds.has(member.userId as string))
      .map((member) => member.id);
  }

  return (
    <MembersBrowser
      accounts={accounts}
      members={members}
      signInOff={signInOff}
    />
  );
}
