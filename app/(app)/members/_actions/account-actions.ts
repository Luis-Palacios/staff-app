"use server";

import type { PermissionCheck } from "@/lib/auth/permissions";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { cancelInvite, createInvite, listUsers } from "@/api/auth-api/client";
import {
  linkMemberUser,
  listMembers,
  unlinkMemberUser,
} from "@/api/members-api/client";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { forbiddenUnless } from "@/lib/auth/get-permissions";
import { AuthRole } from "@/lib/auth/roles";
import {
  getLinkedUserIds,
  getSuggestedMembers,
  getSuggestedUsers,
} from "@/lib/members/account";

/** What the dialogs show on failure, already in the user's language. */
export interface AccountActionFailure {
  ok: false;
  error: string;
}

export type AccountActionResult =
  | { ok: true }
  | (AccountActionFailure & {
      /** `userExists`: invite refused because that email already has an account. */
      code?: "userExists";
    });

export interface LinkableUser {
  id: string;
  name: string;
  email: string;
}

export type LinkableUsersResult =
  | { ok: true; users: LinkableUser[]; suggestedIds: string[] }
  | AccountActionFailure;

const ok: AccountActionResult = { ok: true };

async function failure(error: unknown): Promise<AccountActionFailure> {
  return { ok: false, error: await getApiErrorMessage(error) };
}

function revalidateAccountPages() {
  revalidatePath("/members");
  revalidatePath("/members/[id]", "page");
  revalidatePath("/users");
  revalidatePath("/users/[id]", "page");
}

// The API and auth-server enforce the permissions too; this keeps a call the user can't make from
// going out at all and gives the same "only admins and elders" message.
async function requirePermissions(
  check: PermissionCheck,
): Promise<AccountActionFailure | null> {
  const forbidden = await forbiddenUnless(check);

  return forbidden ? failure(forbidden) : null;
}

// Link, unlink and the link dialogs (`members: link`).
const requireLinkManager = () => requirePermissions({ members: ["link"] });

/** Users no member is linked to, for the link dialog, plus the ones with the member's email. */
export async function listLinkableUsersAction(
  memberId: number,
): Promise<LinkableUsersResult> {
  const denied = await requirePermissions({
    members: ["link", "view", "all"],
    user: ["list"],
  });

  if (denied) return denied;

  try {
    const cookie = (await headers()).get("cookie") ?? "";
    const [{ users }, members] = await Promise.all([
      listUsers(cookie),
      listMembers(),
    ]);
    const member = members.find((candidate) => candidate.id === memberId);
    const linked = getLinkedUserIds(members);
    const free = users.filter((user) => !linked.has(user.id));

    return {
      ok: true,
      users: free.map(({ id, name, email }) => ({ id, name, email })),
      suggestedIds: member
        ? getSuggestedUsers(member, users, linked).map((user) => user.id)
        : [],
    };
  } catch (error) {
    return failure(error);
  }
}

export interface LinkableMember {
  id: number;
  name: string;
  email: string | null;
}

export type LinkableMembersResult =
  | { ok: true; members: LinkableMember[]; suggestedIds: number[] }
  | AccountActionFailure;

/** Members with no user, for the User detail link dialog, plus the ones with the user's email. */
export async function listLinkableMembersAction(
  userId: string,
): Promise<LinkableMembersResult> {
  const denied = await requirePermissions({
    members: ["link", "view", "all"],
    user: ["list"],
  });

  if (denied) return denied;

  try {
    const cookie = (await headers()).get("cookie") ?? "";
    const [{ users }, members] = await Promise.all([
      listUsers(cookie),
      listMembers(),
    ]);
    const user = users.find((candidate) => candidate.id === userId);
    const free = members.filter((member) => !member.userId);

    return {
      ok: true,
      members: free.map(({ id, name, email }) => ({ id, name, email })),
      suggestedIds: user
        ? getSuggestedMembers(user, free).map((member) => member.id)
        : [],
    };
  } catch (error) {
    return failure(error);
  }
}

export async function linkMemberUserAction(
  memberId: string,
  userId: string,
): Promise<AccountActionResult> {
  const denied = await requireLinkManager();

  if (denied) return denied;

  try {
    await linkMemberUser(memberId, userId);
  } catch (error) {
    return failure(error);
  }

  revalidateAccountPages();

  return ok;
}

export async function unlinkMemberUserAction(
  memberId: string,
): Promise<AccountActionResult> {
  const denied = await requireLinkManager();

  if (denied) return denied;

  try {
    await unlinkMemberUser(memberId);
  } catch (error) {
    return failure(error);
  }

  revalidateAccountPages();

  return ok;
}

async function forwardedRequest() {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host");
  const protocol = incoming.get("x-forwarded-proto") ?? "http";

  return {
    cookie: incoming.get("cookie") ?? "",
    origin: incoming.get("origin") ?? `${protocol}://${host}`,
    acceptLanguage: incoming.get("accept-language"),
  };
}

/** Invites the member's email with the chosen role (the dialog defaults to User). */
export async function inviteMemberAction(
  email: string,
  role: AuthRole = AuthRole.User,
): Promise<AccountActionResult> {
  const denied = await requirePermissions({
    members: ["link"],
    invites: ["create"],
    user: ["list"],
  });

  if (denied) return denied;

  try {
    const { users } = await listUsers((await headers()).get("cookie") ?? "");

    if (
      users.some(
        (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
      )
    ) {
      return { ok: false, error: "", code: "userExists" };
    }

    await createInvite(await forwardedRequest(), {
      email,
      role,
    });
  } catch (error) {
    return failure(error);
  }

  revalidateAccountPages();

  return ok;
}

export async function cancelMemberInviteAction(
  token: string,
): Promise<AccountActionResult> {
  const denied = await requirePermissions({
    members: ["link"],
    invites: ["cancel"],
  });

  if (denied) return denied;

  try {
    await cancelInvite(await forwardedRequest(), token);
  } catch (error) {
    return failure(error);
  }

  revalidateAccountPages();

  return ok;
}
