import "server-only";

import type { MemberStatusChange } from "@/api/members-api/types";

import { headers } from "next/headers";

import { listUsers } from "@/api/auth-api/client";
import { getMemberStatusHistory } from "@/api/members-api/client";

export interface StatusHistoryEntry extends MemberStatusChange {
  /** `changedByName`, else the changing user's own name, else null. */
  changedBy: string | null;
}

/**
 * The status history (`members: setStatus`), newest first. `changedByName` is the member linked to
 * whoever made the change; for a user with no member it falls back to the user's name from
 * auth-server. If that list can't be read the entry just has no name.
 */
export async function loadStatusHistory(
  id: string,
): Promise<StatusHistoryEntry[]> {
  const history = await getMemberStatusHistory(id);
  let names: Map<string, string> | null = null;

  if (history.some((change) => change.changedByName === null)) {
    const cookie = (await headers()).get("cookie") ?? "";

    names = await listUsers(cookie)
      .then(({ users }) => new Map(users.map((user) => [user.id, user.name])))
      .catch(() => null);
  }

  return history.map((change) => ({
    ...change,
    changedBy:
      change.changedByName ?? names?.get(change.changedByUserId) ?? null,
  }));
}
