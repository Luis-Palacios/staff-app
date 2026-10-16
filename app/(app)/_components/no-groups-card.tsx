import { UserGroupIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import { NewGroupLink } from "../groups/_components/new-group-link";

import { EmptyState } from "@/components/empty-state";

// The Groups dashboard's nudge to create a first group, shown in place of the week and the
// follow-up card when there is no open group (rule 3).
export async function NoGroupsCard() {
  const t = await getTranslations("GroupsPage");

  return (
    <EmptyState
      action={<NewGroupLink variant="empty" />}
      icon={UserGroupIcon}
      title={t("emptyTitle")}
    >
      {t("emptyBody")}
    </EmptyState>
  );
}
