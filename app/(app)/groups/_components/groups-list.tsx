import { UserGroupIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import GroupsBrowser from "./groups-browser";
import { NewGroupLink } from "./new-group-link";

import { getMe } from "@/api/members-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";
import { EmptyState } from "@/components/empty-state";

export default async function GroupsList({ scoped }: { scoped: boolean }) {
  const groups = await listSmallGroups();

  if (groups.length === 0) {
    const t = await getTranslations("GroupsPage");

    if (scoped) {
      // Creating groups is for full roles, so no action: the copy says who to ask. An empty list
      // is either "not linked to a member" or "leads nothing".
      const { member } = await getMe();
      const key = member === null ? "notLinked" : "noLedGroups";

      return (
        <EmptyState icon={UserGroupIcon} title={t(`${key}Title`)}>
          {t(`${key}Body`)}
        </EmptyState>
      );
    }

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
