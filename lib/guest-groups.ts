import "server-only";

import { cache } from "react";

import { getFeatures } from "@/api/members-api/client";
import { listSmallGroups } from "@/api/small-groups-api/client";

/**
 * Ids of the guest groups the caller can see, for a row that only knows its group's id (a
 * conversation: the inbox sends no `audience` on `group`). Empty when the setting is off, so a
 * church without guest groups pays no extra call, and when the read fails: the badge is a hint.
 */
export const getGuestGroupIds = cache(async (): Promise<number[]> => {
  try {
    if (!(await getFeatures()).guestGroups) return [];

    const groups = await listSmallGroups();

    return groups
      .filter(({ audience }) => audience === "guests")
      .map(({ id }) => id);
  } catch {
    return [];
  }
});
