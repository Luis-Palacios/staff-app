import { UsersIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import { AddMemberLink } from "./add-member-link";
import MembersBrowser from "./members-browser";

import { listMembers } from "@/api/members-api/client";
import { EmptyState } from "@/components/empty-state";

export default async function MembersList() {
  const members = await listMembers();

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

  return <MembersBrowser members={members} />;
}
