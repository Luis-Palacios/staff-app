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

// The in-app list (`/me/notifications`, notifications spec Part 1). Hand-written to
// `NotificationsPageSchema` and its siblings; there is no generator.

export type NotificationCategory =
  | "report_conversation"
  | "report_submitted"
  | "report_reminder";

export type NotificationTemplate =
  | "report-conversation.new"
  | "report-conversation.reply"
  | "report.submitted"
  | "report.reminder";

/** One entry of the list. `data` is exactly the email delivery's data for `template`, so its keys
 *  depend on the template and are read defensively (`lib/notifications/entry.ts`). */
export interface Notification {
  id: number;
  category: NotificationCategory;
  template: NotificationTemplate;
  data: Record<string, unknown>;
  /** Where the entry opens; only ever followed through `/notifications/open/{id}`. */
  path: string;
  createdAt: string;
  readAt: string | null;
}

/** `GET /me/notifications`, newest first. `nextBefore` is the cursor for the next page (`before`),
 *  `null` on the last one. */
export interface NotificationsPage {
  items: Notification[];
  nextBefore: number | null;
}

/** `GET /me/notifications/unread-count`. Never 404: `{ enabled: false, unread: 0 }` while in-app is
 *  off at the server, which hides the bell. */
export interface UnreadCount {
  enabled: boolean;
  unread: number;
}

/** `POST /me/notifications/{id}/read`. */
export interface NotificationOpened {
  path: string;
}

/** `POST /me/notifications/read-all`. */
export interface NotificationsMarked {
  marked: number;
}
