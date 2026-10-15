"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { cancelInvite, createInvite, listUsers } from "@/api/auth-api/client";
import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";
import { ApiError } from "@/api/api-client";
import {
  linkMemberUser,
  listMembers,
  unlinkMemberUser,
} from "@/api/members-api/client";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { AuthRole, canManageLinks } from "@/lib/auth/roles";
import { getLinkedUserIds, getSuggestedUsers } from "@/lib/members/account";

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

// The API and auth-server enforce the role too; this keeps a non-admin's call from going out at
// all and gives the same "only admins and elders" message.
async function requireLinkManager(): Promise<AccountActionFailure | null> {
  const { user } = await requireStaffSession();

  return canManageLinks(user.role)
    ? null
    : failure(
        new ApiError({
          status: 403,
          statusText: "Forbidden",
          url: "",
          method: "",
          body: null,
        }),
      );
}

/** Users no member is linked to, for the link dialog, plus the ones with the member's email. */
export async function listLinkableUsersAction(
  memberId: number,
): Promise<LinkableUsersResult> {
  const denied = await requireLinkManager();

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

/** Invites the member's email with the fixed role Small Group Leader. */
export async function inviteMemberAction(
  email: string,
): Promise<AccountActionResult> {
  const denied = await requireLinkManager();

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
      role: AuthRole.SmallGroupLeader,
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
  const denied = await requireLinkManager();

  if (denied) return denied;

  try {
    await cancelInvite(await forwardedRequest(), token);
  } catch (error) {
    return failure(error);
  }

  revalidateAccountPages();

  return ok;
}
