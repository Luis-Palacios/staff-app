"use client";

import type { UnreadCount } from "@/api/notifications-api/types";

import { BellIcon } from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { useUnreadCount } from "@/lib/notifications/use-unread-count";

/** Rule 11: 1–99, then "99+"; nothing at 0. */
export function formatBellCount(unread: number): string {
  return unread > 99 ? "99+" : String(unread);
}

// The 44px target, as the top bar's other icon buttons.
export const bellButtonClass =
  "group relative flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary aria-expanded:bg-surface-secondary aria-expanded:text-heading";

/**
 * The bell and its gold count. The ring is the bar's own colour so the count reads as cut out of
 * the icon; it follows the button's tint while hovered or open.
 */
export function BellFace({ unread }: { unread: number }) {
  return (
    <>
      <BellIcon aria-hidden="true" className="size-[22px]" strokeWidth={1.7} />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-[3px] left-[21px] inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-gold-500 px-[5px] text-[11px] leading-none font-bold whitespace-nowrap text-navy-900 tabular-nums group-hover:border-surface-secondary group-aria-expanded:border-surface-secondary"
        >
          {formatBellCount(unread)}
        </span>
      )}
    </>
  );
}

/** "Notifications, 3 unread", or "Notifications" at 0. */
export function useBellLabel(unread: number): string {
  const t = useTranslations("Notifications");

  return unread > 0
    ? t("bellUnread", { count: formatBellCount(unread) })
    : t("bell");
}

/**
 * The top bar's bell (notifications rule 11), for everyone while in-app notifications are on at
 * the server: nothing is drawn when they're off. `initial` is what the layout read; the count then
 * follows navigation and focus.
 */
export function NotificationBell({ initial }: { initial: UnreadCount }) {
  const { enabled, unread } = useUnreadCount(initial);
  const label = useBellLabel(unread);

  if (!enabled) return null;

  return (
    <NextLink
      aria-label={label}
      className={bellButtonClass}
      href="/notifications"
      prefetch={false}
    >
      <BellFace unread={unread} />
    </NextLink>
  );
}
