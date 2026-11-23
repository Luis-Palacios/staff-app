"use client";

import type { UnreadCount } from "@/api/notifications-api/types";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { loadUnreadCount } from "@/app/(app)/_actions/in-app-notification-actions";
import { syncAppBadge } from "@/lib/notifications/app-badge";

/** Fired by anything that changes what is unread (*Mark all read*), so the bell reads again. */
const CHANGED = "ekk:notifications-changed";

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(CHANGED));
}

/** Reads closer together than this are skipped (focus and a navigation often land together). */
const MIN_GAP_MS = 2000;

/**
 * The unread count the bell shows. It starts from what the layout rendered on the server and is
 * read again (rule 11) when the path changes, when the window gets focus or the tab shows again,
 * and when something calls `notifyNotificationsChanged`. A layout that renders again with a new
 * count wins over what was read here. Each value shown also goes to the app icon badge (rule 17).
 */
export function useUnreadCount(initial: UnreadCount): UnreadCount {
  const [shown, setShown] = useState(initial);
  const [synced, setSynced] = useState(initial);
  const pathname = usePathname();
  const lastRead = useRef(0);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  if (initial !== synced) {
    setSynced(initial);
    setShown(initial);
  }

  const refresh = useCallback((force: boolean) => {
    const now = Date.now();
    const wait = MIN_GAP_MS - (now - lastRead.current);

    // Too soon after the last read: read once more when the gap ends, so an event inside the gap
    // is never lost (one pending read at most).
    if (!force && wait > 0) {
      trailing.current ??= setTimeout(() => {
        trailing.current = null;
        refresh(true);
      }, wait);

      return;
    }

    if (trailing.current) {
      clearTimeout(trailing.current);
      trailing.current = null;
    }
    lastRead.current = now;
    loadUnreadCount()
      .then((next) => {
        if (next) setShown(next);
      })
      .catch(() => {});
  }, []);

  // The server already read it for this page: skip the first run.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;

      return;
    }

    refresh(false);
  }, [pathname, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh(false);
    };
    const onFocus = () => refresh(false);
    const onChanged = () => refresh(true);

    window.addEventListener("focus", onFocus);
    window.addEventListener(CHANGED, onChanged);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(CHANGED, onChanged);
      document.removeEventListener("visibilitychange", onVisible);
      if (trailing.current) clearTimeout(trailing.current);
      trailing.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    syncAppBadge(shown.enabled ? shown.unread : 0);
  }, [shown]);

  return shown;
}
