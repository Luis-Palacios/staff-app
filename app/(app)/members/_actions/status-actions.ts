"use server";

import type {
  MemberDeactivateInput,
  MemberDetail,
} from "@/api/members-api/types";

import { revalidatePath } from "next/cache";

import { ApiError } from "@/api/api-client";
import { deactivateMember, reactivateMember } from "@/api/members-api/client";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { forbiddenUnless } from "@/lib/auth/get-permissions";

/** A group the member leads, from the `leads_group` 409. */
export interface LeadsGroup {
  id: number;
  name: string;
}

export type MemberStatusActionResult =
  | { ok: true; member: MemberDetail }
  | {
      ok: false;
      /** The API's 409 `code`, so the dialog can branch (`leads_group`, `already_inactive`, …). */
      code?: string;
      groups?: LeadsGroup[];
      error: string;
    };

function readConflict(error: unknown): {
  code?: string;
  groups?: LeadsGroup[];
} {
  if (
    !(error instanceof ApiError) ||
    error.status !== 409 ||
    typeof error.body !== "object" ||
    error.body === null
  ) {
    return {};
  }

  const { code, groups } = error.body as { code?: unknown; groups?: unknown };

  return {
    ...(typeof code === "string" && { code }),
    ...(Array.isArray(groups) && { groups: groups as LeadsGroup[] }),
  };
}

async function failure(error: unknown): Promise<MemberStatusActionResult> {
  return {
    ok: false,
    ...readConflict(error),
    error: await getApiErrorMessage(error),
  };
}

function revalidateMember(id: string) {
  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  // Deactivating ends their group periods, so the group pages change too.
  revalidatePath("/groups");
  revalidatePath("/groups/[id]", "page");
  revalidatePath("/users");
}

/**
 * Marks the member inactive. Turning sign-in off is the caller's next step (rule 9): the dialog
 * bans the linked user from the browser once this returns `ok`.
 */
export async function deactivateMemberAction(
  id: string,
  input: MemberDeactivateInput,
): Promise<MemberStatusActionResult> {
  const forbidden = await forbiddenUnless({ members: ["setStatus"] });

  if (forbidden) return failure(forbidden);

  try {
    const member = await deactivateMember(id, input);

    revalidateMember(id);

    return { ok: true, member };
  } catch (error) {
    return failure(error);
  }
}

export async function reactivateMemberAction(
  id: string,
  note?: string | null,
): Promise<MemberStatusActionResult> {
  const forbidden = await forbiddenUnless({ members: ["setStatus"] });

  if (forbidden) return failure(forbidden);

  try {
    const member = await reactivateMember(id, note);

    revalidateMember(id);

    return { ok: true, member };
  } catch (error) {
    return failure(error);
  }
}
