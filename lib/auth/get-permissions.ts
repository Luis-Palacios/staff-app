import "server-only";

import type { Permissions } from "@/lib/auth/permissions";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";

/** The signed-in user's permissions; none without a session. */
export async function getPermissions(): Promise<Permissions> {
  const session = await getServerSession();

  return session?.permissions ?? {};
}
