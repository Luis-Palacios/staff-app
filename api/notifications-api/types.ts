// Shapes of membership-management's notification routes (camelCase, as sent).

/** One flag per kind of email: leaders' comments and conversations (`reportConversation`), a
 *  report being submitted in a watched group (`reportSubmitted`), and the weekly reminder to a
 *  group's leaders to submit the report (`reportReminder`). */
export interface EmailKinds {
  reportConversation: boolean;
  reportSubmitted: boolean;
  reportReminder: boolean;
}

/** `GET`/`PUT /me/notification-preferences`. `email` is the caller's choice per kind; `available`
 *  is each kind's server kill switch: while false, that kind's switch is hidden. */
export interface NotificationPreferences {
  email: EmailKinds;
  available: EmailKinds;
}

/** One row of `GET /me/watched-groups` (every group, open first, then by name). */
export interface WatchedGroup {
  smallGroupId: number;
  name: string;
  closed: boolean;
  watching: boolean;
}

export interface WatchedGroups {
  items: WatchedGroup[];
}

/** `PUT /small-groups/{id}/watch` response. */
export interface GroupWatch {
  smallGroupId: number;
  watching: boolean;
}
