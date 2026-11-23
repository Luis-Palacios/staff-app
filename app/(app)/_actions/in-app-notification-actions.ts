"use server";

import type { UnreadCount } from "@/api/notifications-api/types";
import type { NotificationViewsPage } from "@/lib/notifications/view-types";

import { revalidatePath } from "next/cache";

import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
} from "@/api/notifications-api/client";
import { getLocale } from "@/lib/locale";
import { toNotificationViews } from "@/lib/notifications/entry";

/**
 * The bell's count, read again from the browser (rule 11: on navigation and window focus). `null`
 * on any failure: the bell keeps what it shows rather than flashing to nothing.
 */
export async function loadUnreadCount(): Promise<UnreadCount | null> {
  try {
    return await getUnreadCount();
  } catch {
    return null;
  }
}

export type NotificationsResult =
  | { ok: true; page: NotificationViewsPage }
  | { ok: false };

/** The popover's latest entries and the page's *Show more*: `before` is the previous `nextBefore`. */
export async function loadNotifications(params: {
  limit: number;
  before?: number;
}): Promise<NotificationsResult> {
  try {
    const [page, locale] = await Promise.all([
      listNotifications(params),
      getLocale(),
    ]);

    return {
      ok: true,
      page: {
        items: await toNotificationViews(page.items, locale),
        nextBefore: page.nextBefore,
      },
    };
  } catch {
    return { ok: false };
  }
}

export type MarkAllResult = { ok: true; marked: number } | { ok: false };

/** *Mark all read*, from the popover and the page. */
export async function markAllNotificationsReadAction(): Promise<MarkAllResult> {
  try {
    const { marked } = await markAllNotificationsRead();

    // The page re-reads its list when it is opened next; the bell reads again from the client.
    revalidatePath("/notifications");

    return { ok: true, marked };
  } catch {
    return { ok: false };
  }
}
