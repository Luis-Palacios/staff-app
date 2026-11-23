"use client";

import type { UnreadCount } from "@/api/notifications-api/types";

import clsx from "clsx";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import {
  bellButtonClass,
  BellFace,
} from "@/components/notifications/bell-face";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { useUnreadCount } from "@/lib/notifications/use-unread-count";

/**
 * The top bar's bell (notifications rule 11), for everyone while in-app notifications are on at
 * the server: nothing is drawn when they're off. `initial` is what the layout read; the count then
 * follows navigation and focus. From 1024 px a button opens the popover; below it the bell is a
 * link to `/notifications`. Both are in the markup and CSS shows one, so nothing flashes.
 */
export function NotificationBell({ initial }: { initial: UnreadCount }) {
  const t = useTranslations("Notifications");
  const { enabled, unread } = useUnreadCount(initial);

  if (!enabled) return null;

  // "Notifications, 3 unread", or "Notifications" at 0. The label says the real number; only the
  // badge, where space is short, caps at "99+".
  const label =
    unread > 0 ? t("bellUnread", { count: String(unread) }) : t("bell");

  return (
    <>
      <NextLink
        aria-label={label}
        className={clsx(bellButtonClass, "lg:hidden")}
        href="/notifications"
        prefetch={false}
      >
        <BellFace unread={unread} />
      </NextLink>
      <NotificationPopover label={label} unread={unread} />
    </>
  );
}
