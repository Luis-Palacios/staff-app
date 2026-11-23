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
 * The Notifications card, or nothing: for people who see conversations. Each switch shows while
 * its kind of email is on at the server (`available`); *Submitted reports* and the Watched groups
 * list only for the watch audience. With no switch to show the card is left out. A failed
 * preferences call hides the card (the kill switches are unknown); a failed watched-groups call
 * keeps it, with an error in place of the list.
 */
export async function MyNotifications({
  permissions,
}: {
  permissions: Permissions;
}) {
  if (!canSeeConversationsInbox(permissions)) return null;

  const watcher = canWatchGroups(permissions);
  // Both start at once; the list is only read when a kind of email is on.
  const watched = watcher ? settle(getWatchedGroups()) : null;
  const preferences = await settle(getNotificationPreferences());

  if (!preferences.ok) return null;

  const { email, available } = preferences.value;
  const showConversations = available.reportConversation;
  const showSubmitted = watcher && available.reportSubmitted;

  if (!showConversations && !showSubmitted) return null;

  const list = watched ? await watched : null;

  return (
    <NotificationsCard
      conversationEmails={
        showConversations ? email.reportConversation : undefined
      }
      submittedEmails={showSubmitted ? email.reportSubmitted : undefined}
      watchedGroups={
        list === null ? undefined : list.ok ? list.value.items : null
      }
    />
  );
}
