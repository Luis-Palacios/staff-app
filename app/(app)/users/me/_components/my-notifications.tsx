import type {
  EmailKinds,
  NotificationPreferences,
} from "@/api/notifications-api/types";
import type { Permissions } from "@/lib/auth/permissions";
import type { KindChoice } from "./notifications-card";

import { NotificationsCard } from "./notifications-card";

import { getPushConfig, incomingForwardedRequest } from "@/api/auth-api/client";
import {
  getNotificationPreferences,
  getUnreadCount,
  getWatchedGroups,
} from "@/api/notifications-api/client";
import {
  REPORT_REMINDER_CHECK,
  can,
  canSeeConversationsInbox,
  canWatchGroups,
} from "@/lib/auth/permissions";
import { settle } from "@/lib/settle";

/** One kind's switches for the card: `undefined` when the person doesn't see the kind or both
 *  channels are off at the server for it; otherwise each channel's value, or `undefined` for a
 *  channel that is off (`available` for email, `availablePush` for push). */
function cells(
  visible: boolean,
  preferences: NotificationPreferences,
  kind: keyof EmailKinds,
): KindChoice | undefined {
  if (!visible) return undefined;

  const choice: KindChoice = {
    email: preferences.available[kind] ? preferences.email[kind] : undefined,
    push: preferences.availablePush[kind] ? preferences.push[kind] : undefined,
  };

  return choice.email === undefined && choice.push === undefined
    ? undefined
    : choice;
}

/**
 * The Notifications card, or nothing. Each kind is a row of an Email and a Push switch, a cell
 * shown while that channel is on at the server for that kind (`available`, `availablePush`):
 * *Conversations* for people who see conversations; *Submitted reports* and the Watched groups list
 * for the watch audience among them; *Weekly report reminders* for someone who leads an open group
 * (`leadsGroup`) and can submit reports. With no switch to show the card is left out. A failed
 * preferences call hides the card (the kill switches are unknown); a failed watched-groups call
 * keeps it, with an error in place of the list. *This device* shows while auth-server says push is
 * on (`GET /api/push/config`). While in-app notifications are on (the bell's `unread-count`, since
 * the preferences have no flag for it) the Watching switches are never disabled (notifications
 * rule 7).
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
  // Both start at once; the list is only read when a watch-related kind of email is on.
  const watched = watcher ? settle(getWatchedGroups()) : null;
  const unread = settle(getUnreadCount());
  // The VAPID key for *This device*. A failed read, or push off, leaves the row out.
  const pushConfig = incomingForwardedRequest()
    .then(getPushConfig)
    .catch(() => null);
  const preferences = await settle(getNotificationPreferences());

  if (!preferences.ok) return null;

  // A kind's row shows for who may see it; each cell while that channel is on at the server for it.
  const conversations = cells(
    canSeeConversations,
    preferences.value,
    "reportConversation",
  );
  const submitted = cells(watcher, preferences.value, "reportSubmitted");
  const reminders = cells(
    canReceiveReminders,
    preferences.value,
    "reportReminder",
  );

  if (!conversations && !submitted && !reminders) return null;

  // The Watched groups list belongs to conversations and submitted reports (rule 14): with neither
  // switch shown, a card that holds only *Weekly report reminders* leaves it out.
  const list = watched && (conversations || submitted) ? await watched : null;
  const inApp = await unread.then((count) => count.ok && count.value.enabled);
  const config = await pushConfig;
  const pushPublicKey = config?.enabled ? config.publicKey : null;

  return (
    <NotificationsCard
      conversations={conversations}
      inApp={inApp}
      pushPublicKey={pushPublicKey}
      reminders={reminders}
      submitted={submitted}
      watchedGroups={
        list === null ? undefined : list.ok ? list.value.items : null
      }
    />
  );
}
