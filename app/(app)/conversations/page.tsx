import type { ConversationInboxTab } from "@/api/conversations-api/types";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ConversationsBrowser } from "./_components/conversations-browser";

import { listConversations } from "@/api/conversations-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { getEnv } from "@/lib/env/server";
import { getPermissions } from "@/lib/auth/get-permissions";
import {
  canSeeConversationsInbox,
  getSmallGroupAccess,
} from "@/lib/auth/permissions";

const PAGE_SIZE = 25;
const TABS: readonly ConversationInboxTab[] = ["reply", "open", "resolved"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, permissions, t] = await Promise.all([
    searchParams,
    getPermissions(),
    getTranslations("Conversations"),
  ]);

  // The nav item and this page use the same check: hidden means unreachable by URL too.
  if (!canSeeConversationsInbox(permissions)) notFound();

  const requestedTab = first(params.tab);
  const tab = TABS.find((candidate) => candidate === requestedTab) ?? "reply";
  const requestedGroup = Number(first(params.group));
  const groups = await listSmallGroups();
  // A group that isn't in the list (a stale link) is no filter, so the select never goes blank.
  const groupId = groups.some(({ id }) => id === requestedGroup)
    ? requestedGroup
    : null;
  const elder = getSmallGroupAccess(permissions) === "full";
  const data = await listConversations({
    tab,
    ...(groupId !== null && { smallGroupId: groupId }),
    limit: PAGE_SIZE,
  });

  return (
    <>
      <StaffAppPageHeader
        description={elder ? t("subtitleElder") : t("subtitleLeader")}
        eyebrow={t("eyebrow")}
        title={t("title")}
      />
      <ConversationsBrowser
        data={data}
        elder={elder}
        groupId={groupId}
        groups={groups.map(({ id, name, closedAt }) => ({
          id,
          name,
          closed: closedAt !== null,
        }))}
        tab={tab}
        timeZone={getEnv().CHURCH_TIMEZONE}
      />
    </>
  );
}
