import type { Permissions } from "@/lib/auth/permissions";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CloseGroupCard } from "./_components/close-group-card";
import { GroupDetailHeader } from "./_components/group-detail-header";
import { GroupDetailsCard } from "./_components/group-details-card";
import { GroupReportsCard } from "./_components/group-reports-card";
import { GroupGuestsCard } from "./_components/group-guests-card";
import { GroupMembersCard } from "./_components/group-members-card";
import { GroupWatchCard } from "./_components/group-watch-card";

import { getMe } from "@/api/members-api/client";
import {
  getNotificationPreferences,
  getUnreadCount,
  getWatchedGroups,
} from "@/api/notifications-api/client";
import { loadGroup } from "@/app/(app)/groups/_lib/load-group";
import { SavedToast } from "@/components/saved-toast";
import { getChurchToday } from "@/lib/church-time";
import { getPermissions } from "@/lib/auth/get-permissions";
import { can, canWatchGroups, reportAccess } from "@/lib/auth/permissions";
import { getCurrentSmallGroupAccess } from "@/lib/auth/small-group-access";
import { settle } from "@/lib/settle";

/**
 * The Watching card's data, or null to leave it out: only the full-scope audience, only while
 * a kind of email is on at the server. A failed call leaves the card out rather than the page.
 * `inApp` is whether in-app notifications are on (notifications rule 7): the switch is then never
 * disabled, whatever the caller's email switches say. The preferences have no in-app flag, so it
 * comes from the bell's `unread-count`; a failed read counts as off.
 */
async function loadWatch(
  permissions: Permissions,
  groupId: number,
): Promise<{ watching: boolean; channelsOn: boolean; inApp: boolean } | null> {
  if (!canWatchGroups(permissions)) return null;

  const [preferences, watched, unread] = await Promise.all([
    settle(getNotificationPreferences()),
    settle(getWatchedGroups()),
    settle(getUnreadCount()),
  ]);

  if (!preferences.ok || !watched.ok) return null;

  const { email, available, push, availablePush } = preferences.value;

  // A kind that is off at the server on every channel can't send, whatever the caller chose.
  if (
    !available.reportConversation &&
    !available.reportSubmitted &&
    !availablePush.reportConversation &&
    !availablePush.reportSubmitted
  ) {
    return null;
  }

  const row = watched.value.items.find((item) => item.smallGroupId === groupId);

  return row
    ? {
        watching: row.watching,
        // Rule 7: any email or push switch Watching covers is on.
        channelsOn:
          (available.reportConversation && email.reportConversation) ||
          (available.reportSubmitted && email.reportSubmitted) ||
          (availablePush.reportConversation && push.reportConversation) ||
          (availablePush.reportSubmitted && push.reportSubmitted),
        inApp: unread.ok && unread.value.enabled,
      }
    : null;
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const access = await getCurrentSmallGroupAccess();

  if (access === "none") notFound();

  const [{ id }, { saved }, t] = await Promise.all([
    params,
    searchParams,
    getTranslations("GroupSavedToast"),
  ]);
  const group = await loadGroup(id);
  const me = await getMe();
  // Marks the caller's own row, which a scoped user can't change (rule 9). Full roles don't need it.
  const currentMemberId = access === "scoped" ? (me.member?.id ?? null) : null;
  // New report needs a linked member (rule 5); a closed group never takes one (rule 8).
  const permissions = await getPermissions();
  const { canSubmit } = reportAccess(permissions, me);
  const watch = await loadWatch(permissions, group.id);

  return (
    <>
      <GroupDetailHeader group={group} />
      <div className="flex flex-wrap items-start gap-5">
        {group.audience === "guests" ? (
          <div className="flex min-w-0 flex-[3_1_340px] flex-col gap-5">
            <GroupGuestsCard group={group} today={getChurchToday()} />
            <GroupMembersCard
              access={access}
              currentMemberId={currentMemberId}
              group={group}
              today={getChurchToday()}
            />
          </div>
        ) : (
          <GroupMembersCard
            access={access}
            currentMemberId={currentMemberId}
            group={group}
            today={getChurchToday()}
          />
        )}
        <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-5">
          <GroupDetailsCard group={group} />
          {watch && (
            <GroupWatchCard
              channelsOn={watch.channelsOn}
              groupId={group.id}
              inApp={watch.inApp}
              watching={watch.watching}
            />
          )}
          <GroupReportsCard canSubmit={canSubmit} group={group} />
          {!group.closedAt && can(permissions, { smallGroups: ["close"] }) && (
            <CloseGroupCard group={group} />
          )}
        </div>
      </div>
      {(saved === "created" || saved === "updated" || saved === "closed") && (
        <SavedToast message={t(saved)} />
      )}
    </>
  );
}
