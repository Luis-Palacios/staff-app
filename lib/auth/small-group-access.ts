import "server-only";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { getSmallGroupAccess, type SmallGroupAccess } from "@/lib/auth/roles";

/** The signed-in user's small group access, read from the session role. */
export async function getCurrentSmallGroupAccess(): Promise<SmallGroupAccess> {
  const session = await getServerSession();

  return getSmallGroupAccess(session?.user.role);
}
