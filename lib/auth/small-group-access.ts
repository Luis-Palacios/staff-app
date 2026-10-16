import "server-only";

import type { SmallGroupAccess } from "@/lib/auth/permissions";

import { getPermissions } from "@/lib/auth/get-permissions";
import { getSmallGroupAccess } from "@/lib/auth/permissions";

/** The signed-in user's small group access, read from the session permissions. */
export async function getCurrentSmallGroupAccess(): Promise<SmallGroupAccess> {
  return getSmallGroupAccess(await getPermissions());
}
