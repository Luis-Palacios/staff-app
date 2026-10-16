import "server-only";

import type { AuthSessionUser } from "@/api/auth-api/types";
import type { MemberDetail } from "@/api/members-api/types";
import type { Permissions, SmallGroupAccess } from "@/lib/auth/permissions";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { getMe, getMember } from "@/api/members-api/client";
import { getSmallGroupAccess } from "@/lib/auth/permissions";

export interface MyProfile {
  user: AuthSessionUser;
  permissions: Permissions;
  /** The signed-in user's member, or `null` when no member is linked. */
  member: MemberDetail | null;
  access: SmallGroupAccess;
  /** Ids of the small groups the viewer actively leads. */
  leadIds: ReadonlySet<number>;
}

/**
 * The signed-in user's own profile, for `/users/me`. Unlike `loadUser()` this is open to every
 * role: it reads the session and `GET /me`, never an id from the URL. A link to a member that no
 * longer exists counts as not linked; any other error goes to `app/(app)/error.tsx`.
 */
export const loadMyProfile = cache(async (): Promise<MyProfile> => {
  const session = await getServerSession();

  // The (app) layout already guards this; the redirect only narrows the type.
  if (!session) redirect("/sign-in");

  const me = await getMe();
  let member: MemberDetail | null = null;

  if (me.member) {
    try {
      member = await getMember(String(me.member.id));
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
  }

  return {
    user: session.user,
    permissions: session.permissions,
    member,
    access: getSmallGroupAccess(session.permissions),
    leadIds: new Set(me.leads.map((lead) => lead.smallGroupId)),
  };
});
