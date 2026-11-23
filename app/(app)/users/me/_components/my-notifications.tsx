import type { Permissions } from "@/lib/auth/permissions";

import { NotificationsCard } from "./notifications-card";

import {
  getNotificationPreferences,
  getWatchedGroups,
} from "@/api/notifications-api/client";
import {
  canSeeConversationsInbox,
  canWatchGroups,
} from "@/lib/auth/permissions";
import { settle } from "@/lib/settle";

/**
 * The Notifications card, or nothing: for people who see conversations, while emails are on at the
 * server. A failed preferences call hides the card (the kill switch is unknown); a failed
 * watched-groups call keeps it, with an error in place of the list.
 */
export async function MyNotifications({
  permissions,
}: {
  permissions: Permissions;
}) {
  if (!canSeeConversationsInbox(permissions)) return null;

  // Both start at once; the list is only read when emails are on.
  const watched = canWatchGroups(permissions)
    ? settle(getWatchedGroups())
    : null;
  const preferences = await settle(getNotificationPreferences());

  if (!preferences.ok || !preferences.value.emailsEnabled) return null;

  const list = watched ? await watched : null;

  return (
    <NotificationsCard
      conversationEmails={preferences.value.conversationEmails}
      watchedGroups={
        list === null ? undefined : list.ok ? list.value.items : null
      }
    />
  );
}
