// What the notification UI draws, made on the server from the API's entries
// (`lib/notifications/entry.ts`) and handed to client components as plain text. Types only, so
// both sides can import it.

/** Picks the tile's icon and colours: a conversation comment, a held report, a "didn't meet"
 *  report, a reminder to submit. */
export type NotificationKind =
  | "conversation"
  | "submitted"
  | "noMeeting"
  | "reminder";

export interface NotificationView {
  id: number;
  kind: NotificationKind;
  title: string;
  /** The line under the title: the group and report date, the attendance, or the week. */
  secondary: string;
  unread: boolean;
  /** The church-time calendar day ("YYYY-MM-DD") the entry was made, to group the page by. */
  dayKey: string;
  /** "Today", "Yesterday" or the date, for the day's heading. */
  dayLabel: string;
  /** "9:41 AM": the page's time column. */
  time: string;
  /** "9:41 AM", "Yesterday", "Sat" or "Nov 14": the popover's narrower time column. */
  short: string;
  /** The link's accessible name: the kind, both lines, the time and whether it's unread. */
  label: string;
}

/** A page of views and the cursor for the next one (`null` on the last page). */
export interface NotificationViewsPage {
  items: NotificationView[];
  nextBefore: number | null;
}
