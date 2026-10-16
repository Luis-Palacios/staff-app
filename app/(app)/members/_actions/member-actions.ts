"use server";

import type { MemberInput } from "@/api/members-api/types";
import type {
  MemberFieldErrors,
  MemberFormValues,
} from "@/app/(app)/members/_lib/member-schema";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { createMember, updateMember } from "@/api/members-api/client";
import {
  memberChangesSchema,
  memberSchema,
  toFieldErrors,
} from "@/app/(app)/members/_lib/member-schema";
import { inviteMemberAction } from "@/app/(app)/members/_actions/account-actions";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { forbiddenUnless, hasPermission } from "@/lib/auth/get-permissions";

/** A failed save. Success never returns: it redirects to the detail page. */
export interface MemberActionFailure {
  ok: false;
  fieldErrors?: MemberFieldErrors;
  formError?: string;
}

async function toFailure(error: unknown): Promise<MemberActionFailure> {
  if (error instanceof ApiError && error.status === 409) {
    return { ok: false, fieldErrors: { email: "emailDuplicate" } };
  }

  return { ok: false, formError: await getApiErrorMessage(error) };
}

/**
 * POST: empty optional fields are omitted. With `invite`, the member's email is then invited
 * (role Small Group Leader). The member is never rolled back if the invite fails: the redirect
 * says so and the Account card can retry.
 */
export async function createMemberAction(
  values: MemberFormValues,
  invite = false,
): Promise<MemberActionFailure> {
  const forbidden = await forbiddenUnless({ members: ["create"] });

  if (forbidden) return toFailure(forbidden);

  const parsed = memberSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  const { name, email, phone, address, birthDate, sex } = parsed.data;
  const input: MemberInput = {
    name,
    ...(email && { email }),
    ...(phone && { phone }),
    ...(address && { address }),
    ...(birthDate && { birthDate }),
    ...(sex && { sex }),
  };
  let id: number;

  try {
    ({ id } = await createMember(input));
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/members");

  if (
    invite &&
    email &&
    (await hasPermission({ members: ["link"], invites: ["create"] }))
  ) {
    const result = await inviteMemberAction(email);

    redirect(
      `/members/${id}?saved=${result.ok ? "createdInvited" : "inviteFailed"}`,
    );
  }

  redirect(`/members/${id}?saved=created`);
}

/**
 * PATCH: `changes` holds only the fields that changed; an empty optional
 * field becomes `null`, which clears it.
 */
export async function updateMemberAction(
  id: string,
  changes: Partial<MemberFormValues>,
): Promise<MemberActionFailure> {
  const forbidden = await forbiddenUnless({ members: ["update"] });

  if (forbidden) return toFailure(forbidden);

  const parsed = memberChangesSchema.safeParse(changes);

  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  }

  // Rule 8: the API answers 403 to a PATCH that has `email` from a caller without `members: all`,
  // even if the value is unchanged, so the key must not be in the body at all.
  const { name, ...rest } = parsed.data;
  const optional = (await hasPermission({ members: ["all"] }))
    ? rest
    : Object.fromEntries(
        Object.entries(rest).filter(([field]) => field !== "email"),
      );
  const patch: Partial<MemberInput> = {
    ...(name !== undefined && { name }),
    ...Object.fromEntries(
      Object.entries(optional).map(([field, value]) => [field, value || null]),
    ),
  };

  try {
    await updateMember(id, patch);
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/members");
  revalidatePath(`/members/${id}`);
  redirect(`/members/${id}?saved=updated`);
}
