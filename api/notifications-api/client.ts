import type { ApiFetchOptions } from "@/api/api-client";
import type {
  EmailKinds,
  GroupWatch,
  NotificationOpened,
  NotificationPreferences,
  NotificationsMarked,
  NotificationsPage,
  UnreadCount,
  WatchedGroups,
} from "@/api/notifications-api/types";

import { cache } from "react";

import { authenticatedFetch } from "@/api/authenticated-fetch";
import { getEnv } from "@/lib/env/server";

function request<TResponse>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TResponse> {
  return authenticatedFetch<TResponse>(
    getEnv().APPLICATIONS_MEMBERSHIP_API_URL,
    path,
    { cache: "no-store", ...options },
  );
}

/** The caller's email choice and the server's kill switch, per kind of email. Any signed-in user.
 *  Cached per render: My profile, the group page and the panel note all read it. */
export const getNotificationPreferences = cache(
  (): Promise<NotificationPreferences> =>
    request<NotificationPreferences>("/me/notification-preferences"),
);

/** Whether conversation emails are on at the server, for the panel's composer note. A failed call
 *  counts as off: the note then says who sees the conversation, which is always true. */
export const getConversationEmailsAvailable = cache(
  (): Promise<boolean> =>
    getNotificationPreferences().then(
      (preferences) => preferences.available.reportConversation,
      () => false,
    ),
);

/** Any subset of the three keys under `email` and/or `push`; the server answers 422 for anything
 *  else. */
export function updateNotificationPreferences(input: {
  email?: Partial<EmailKinds>;
  push?: Partial<EmailKinds>;
}): Promise<NotificationPreferences> {
  return request<NotificationPreferences>("/me/notification-preferences", {
    method: "PUT",
    body: input,
  });
}

/** Every group with the caller's Watching state. 403 outside the full-scope audience
 *  (`canWatchGroups`). Cached per render. */
export const getWatchedGroups = cache(
  (): Promise<WatchedGroups> => request<WatchedGroups>("/me/watched-groups"),
);

/** Watch or unwatch one group (deletes or inserts the opt-out). 403 before 404. */
export function setGroupWatching(
  groupId: number,
  watching: boolean,
): Promise<GroupWatch> {
  return request<GroupWatch>(
    `/small-groups/${encodeURIComponent(String(groupId))}/watch`,
    { method: "PUT", body: { watching } },
  );
}

/** Whether in-app notifications are on at the server, and how many entries the caller hasn't
 *  opened. Never 404 (`enabled: false` instead), so it is the one call that is safe to make first.
 *  Cached per render: the layout and a page both read it. */
export const getUnreadCount = cache(
  (): Promise<UnreadCount> =>
    request<UnreadCount>("/me/notifications/unread-count"),
);

/** The caller's entries, newest first. `before` is the previous page's `nextBefore`. 404
 *  `notifications_disabled` while in-app is off at the server. */
export function listNotifications(
  params: { limit?: number; before?: number } = {},
): Promise<NotificationsPage> {
  const query = new URLSearchParams();

  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.before !== undefined) query.set("before", String(params.before));

  const suffix = query.size > 0 ? `?${query}` : "";

  return request<NotificationsPage>(`/me/notifications${suffix}`);
}

/** Marks one entry read (idempotent) and says where it opens. 404 when it isn't the caller's or
 *  is gone. Does not reset the conversation email throttle: opening the thread does. */
export function markNotificationRead(id: number): Promise<NotificationOpened> {
  return request<NotificationOpened>(
    `/me/notifications/${encodeURIComponent(String(id))}/read`,
    { method: "POST" },
  );
}

/** Marks every unread entry read. */
export function markAllNotificationsRead(): Promise<NotificationsMarked> {
  return request<NotificationsMarked>("/me/notifications/read-all", {
    method: "POST",
  });
}
