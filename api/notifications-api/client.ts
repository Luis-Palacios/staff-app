import type { ApiFetchOptions } from "@/api/api-client";
import type {
  GroupWatch,
  NotificationPreferences,
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

/** The caller's "Conversation emails" choice and the server's kill switch. Any signed-in user.
 *  Cached per render: My profile, the group page and the panel note all read it. */
export const getNotificationPreferences = cache(
  (): Promise<NotificationPreferences> =>
    request<NotificationPreferences>("/me/notification-preferences"),
);

/** Whether emails are on at the server, for the panel's composer note. A failed call counts as off:
 *  the note then says who sees the conversation, which is always true. */
export const getEmailsEnabled = cache(
  (): Promise<boolean> =>
    getNotificationPreferences().then(
      (preferences) => preferences.emailsEnabled,
      () => false,
    ),
);

export function updateNotificationPreferences(input: {
  conversationEmails: boolean;
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
