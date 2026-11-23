"use server";

import type { UnreadCount } from "@/api/notifications-api/types";

import { getUnreadCount } from "@/api/notifications-api/client";

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
