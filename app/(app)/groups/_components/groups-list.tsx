import { UserGroupIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import GroupsBrowser from "./groups-browser";
import { NewGroupLink } from "./new-group-link";

import { listSmallGroups } from "@/api/small-groups-api/client";
import { EmptyState } from "@/components/empty-state";

export default async function GroupsList() {
  const groups = await listSmallGroups();

  if (groups.length === 0) {
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

  return <GroupsBrowser groups={groups} />;
}
