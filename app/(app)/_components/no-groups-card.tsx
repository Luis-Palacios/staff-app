import type { SmallGroupSummary } from "@/api/small-groups-api/types";
import type { Settled } from "@/lib/settle";

import { UserGroupIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import { NewGroupLink } from "../groups/_components/new-group-link";

import { EmptyState } from "@/components/empty-state";

// The dashboard's nudge to create a first group. It shows only when the
// groups loaded and none is active; with active groups, or if the fetch
// failed, there is nothing to say here.
export async function NoGroupsCard({
  groups,
}: {
  groups: Promise<Settled<SmallGroupSummary[]>>;
}) {
  const result = await groups;

  if (!result.ok || result.value.some((group) => group.closedAt === null)) {
    return null;
  }

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
