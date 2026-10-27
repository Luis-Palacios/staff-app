"use server";

import type { TaggablePerson } from "@/api/small-groups-api/types";

import { searchTaggablePeople } from "@/api/small-groups-api/client";
import { hasPermission } from "@/lib/auth/get-permissions";

/** The API answers `[]` below this; the picker doesn't ask for less either (rule 8). */
const MIN_QUERY_LENGTH = 2;

export type TagSearchResult =
  | { ok: true; people: TaggablePerson[] }
  | { ok: false };

/**
 * Church-wide people to tag in a group's reports. A server action is a public endpoint, so the
 * permission and the length are checked here; the group scope is the API's. A failure carries no
 * text: the picker shows its own message.
 */
export async function searchTaggablePeopleAction(
  groupId: number,
  query: string,
): Promise<TagSearchResult> {
  const text = query.trim();

  if (!Number.isInteger(groupId) || groupId <= 0) return { ok: false };

  if (text.length < MIN_QUERY_LENGTH) return { ok: true, people: [] };

  const [canCreate, canUpdate] = await Promise.all([
    hasPermission({ smallGroupReports: ["create"] }),
    hasPermission({ smallGroupReports: ["update"] }),
  ]);

  if (!canCreate && !canUpdate) return { ok: false };

  try {
    return { ok: true, people: await searchTaggablePeople(groupId, text) };
  } catch {
    return { ok: false };
  }
}
