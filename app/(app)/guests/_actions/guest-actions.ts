"use server";

import type {
  GuestDeactivateInput,
  GuestDetail,
  GuestUpdateInput,
} from "@/api/guests-api/types";
import type {
  GuestFieldErrors,
  GuestFormValues,
} from "@/app/(app)/guests/_lib/guest-schema";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ApiError } from "@/api/api-client";
import {
  createGuest,
  deactivateGuest,
  reactivateGuest,
  updateGuest,
} from "@/api/guests-api/client";
import {
  guestChangesSchema,
  guestSchema,
  toGuestFieldErrors,
} from "@/app/(app)/guests/_lib/guest-schema";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { forbiddenUnless } from "@/lib/auth/get-permissions";
import { getGuestErrorKind } from "@/lib/guest-errors";

/** A failed save. Success never returns: it redirects to the detail page. */
export interface GuestActionFailure {
  ok: false;
  fieldErrors?: GuestFieldErrors;
  formError?: string;
}

async function toFailure(error: unknown): Promise<GuestActionFailure> {
  const kind = getGuestErrorKind(error);

  if (kind === "off" || kind === "closed") {
    const t = await getTranslations("GuestForm.errors");

    return { ok: false, formError: t(kind) };
  }

  return { ok: false, formError: await getApiErrorMessage(error) };
}

/** Empty optional fields are omitted. `smallGroupId` joins an open guest group today. */
export async function createGuestAction(
  values: GuestFormValues,
  invitedByMemberId: number | null,
  smallGroupId: number | null,
): Promise<GuestActionFailure> {
  const forbidden = await forbiddenUnless({
    guests: ["create", "all"],
    ...(smallGroupId !== null && { smallGroups: ["manageMembers"] }),
    ...(invitedByMemberId !== null && { members: ["search"] }),
  });

  if (forbidden) return toFailure(forbidden);

  const parsed = guestSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, fieldErrors: toGuestFieldErrors(parsed.error) };
  }

  const { name, email, phone, address, sex, firstVisitDate } = parsed.data;
  let id: number;

  try {
    ({ id } = await createGuest({
      name,
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(sex && { sex }),
      ...(firstVisitDate && { firstVisitDate }),
      ...(invitedByMemberId !== null && { invitedByMemberId }),
      ...(smallGroupId !== null && { smallGroupId }),
    }));
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/guests");

  if (smallGroupId !== null) revalidatePath(`/groups/${smallGroupId}`);

  redirect(`/guests/${id}?saved=created`);
}

/**
 * `changes` holds only the fields that changed; an empty optional field becomes `null`, which
 * clears it. `invitedByMemberId` is present only when it changed (`null` clears).
 */
export async function updateGuestAction(
  id: string,
  changes: Partial<GuestFormValues>,
  invitedByMemberId?: number | null,
): Promise<GuestActionFailure> {
  const forbidden = await forbiddenUnless({
    guests: ["update"],
    // Clearing the inviter (`null`) needs no lookup.
    ...(invitedByMemberId != null && { members: ["search"] }),
  });

  if (forbidden) return toFailure(forbidden);

  const parsed = guestChangesSchema.safeParse(changes);

  if (!parsed.success) {
    return { ok: false, fieldErrors: toGuestFieldErrors(parsed.error) };
  }

  const { name, firstVisitDate, ...optional } = parsed.data;
  const patch: GuestUpdateInput = {
    ...(name !== undefined && { name }),
    // The first visit can be changed but not cleared.
    ...(firstVisitDate && { firstVisitDate }),
    ...Object.fromEntries(
      Object.entries(optional).map(([field, value]) => [field, value || null]),
    ),
    ...(invitedByMemberId !== undefined && { invitedByMemberId }),
  };

  try {
    await updateGuest(id, patch);
  } catch (error) {
    return toFailure(error);
  }

  revalidatePath("/guests");
  revalidatePath(`/guests/${id}`);
  redirect(`/guests/${id}?saved=updated`);
}

export type GuestStatusActionResult =
  | { ok: true; guest: GuestDetail }
  | {
      ok: false;
      /** The API's 409 `code` (`already_inactive`, `already_active`). */
      code?: string;
      error: string;
    };

async function statusFailure(error: unknown): Promise<GuestStatusActionResult> {
  const code =
    error instanceof ApiError && error.status === 409
      ? (error.body as { code?: unknown } | null)?.code
      : undefined;

  return {
    ok: false,
    ...(typeof code === "string" && { code }),
    error: await getApiErrorMessage(error),
  };
}

function revalidateGuestStatus(id: string) {
  revalidatePath("/guests");
  revalidatePath(`/guests/${id}`);
  // Deactivating ends their group period, so the group pages change too.
  revalidatePath("/groups");
  revalidatePath("/groups/[id]", "page");
}

export async function deactivateGuestAction(
  id: string,
  input: GuestDeactivateInput,
): Promise<GuestStatusActionResult> {
  const forbidden = await forbiddenUnless({ guests: ["deactivate"] });

  if (forbidden) return statusFailure(forbidden);

  try {
    const guest = await deactivateGuest(id, input);

    revalidateGuestStatus(id);

    return { ok: true, guest };
  } catch (error) {
    return statusFailure(error);
  }
}

export async function reactivateGuestAction(
  id: string,
  note?: string | null,
): Promise<GuestStatusActionResult> {
  const forbidden = await forbiddenUnless({ guests: ["reactivate"] });

  if (forbidden) return statusFailure(forbidden);

  try {
    const guest = await reactivateGuest(id, note);

    revalidateGuestStatus(id);

    return { ok: true, guest };
  } catch (error) {
    return statusFailure(error);
  }
}
