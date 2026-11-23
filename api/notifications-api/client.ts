import type { ApiFetchOptions } from "@/api/api-client";
import type {
  EmailKinds,
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

/** Any subset of the three keys; the server answers 422 for anything else. */
export function updateNotificationPreferences(input: {
  email: Partial<EmailKinds>;
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
