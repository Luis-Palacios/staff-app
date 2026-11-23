import type { Permissions } from "@/lib/auth/permissions";

import { NotificationsCard } from "./notifications-card";

import {
  getNotificationPreferences,
  getWatchedGroups,
} from "@/api/notifications-api/client";
import {
  REPORT_REMINDER_CHECK,
  can,
  canSeeConversationsInbox,
  canWatchGroups,
} from "@/lib/auth/permissions";
import { settle } from "@/lib/settle";

/**
 * The Notifications card, or nothing. Each switch shows while its kind of email is on at the
 * server (`available`): *Conversations* for people who see conversations; *Submitted reports* and
 * the Watched groups list for the watch audience among them; *Weekly report reminders* for
 * someone who leads an open group (`leadsGroup`) and can submit reports. With no switch to show
 * the card is left out. A failed preferences call hides the card (the kill switches are unknown);
 * a failed watched-groups call keeps it, with an error in place of the list.
 */
export async function MyNotifications({
  permissions,
  leadsGroup,
}: {
  permissions: Permissions;
  /** Whether the caller actively leads or co-leads at least one open group. */
  leadsGroup: boolean;
}) {
  const canSeeConversations = canSeeConversationsInbox(permissions);
  const canReceiveReminders =
    leadsGroup && can(permissions, REPORT_REMINDER_CHECK);

  if (!canSeeConversations && !canReceiveReminders) return null;

  const watcher = canSeeConversations && canWatchGroups(permissions);
  // Both start at once; the list is only read when a kind of email is on.
  const watched = watcher ? settle(getWatchedGroups()) : null;
  const preferences = await settle(getNotificationPreferences());

  if (!preferences.ok) return null;

  const { email, available } = preferences.value;
  const showConversations = canSeeConversations && available.reportConversation;
  const showSubmitted = watcher && available.reportSubmitted;
  const showReminders = canReceiveReminders && available.reportReminder;

  if (!showConversations && !showSubmitted && !showReminders) return null;

  const list = watched ? await watched : null;

  return (
    <NotificationsCard
      conversationEmails={
        showConversations ? email.reportConversation : undefined
      }
      reminderEmails={showReminders ? email.reportReminder : undefined}
      submittedEmails={showSubmitted ? email.reportSubmitted : undefined}
      watchedGroups={
        list === null ? undefined : list.ok ? list.value.items : null
      }
    />
  );
}
