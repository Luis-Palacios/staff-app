import "server-only";

import type { GuestDetail, GuestStatusChange } from "@/api/guests-api/types";

import { withChangedBy } from "@/app/(app)/members/_lib/load-status-history";

export interface GuestStatusHistoryEntry extends GuestStatusChange {
  changedBy: string | null;
}

/** The history on the guest, with a name for changes by a user with no member. Null without it. */
export async function loadGuestStatusHistory(
  guest: GuestDetail,
): Promise<GuestStatusHistoryEntry[] | null> {
  return guest.statusHistory ? withChangedBy(guest.statusHistory) : null;
}
