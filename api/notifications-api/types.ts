// Shapes of membership-management's notification routes (camelCase, as sent).

/** `GET`/`PUT /me/notification-preferences`. `emailsEnabled` is the server's kill switch: when
 *  false, every email and watch switch is hidden. */
export interface NotificationPreferences {
  conversationEmails: boolean;
  emailsEnabled: boolean;
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
