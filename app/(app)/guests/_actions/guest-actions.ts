"use server";

import type { GuestUpdateInput } from "@/api/guests-api/types";
import type {
  GuestFieldErrors,
  GuestFormValues,
} from "@/app/(app)/guests/_lib/guest-schema";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createGuest, updateGuest } from "@/api/guests-api/client";
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
  const forbidden = await forbiddenUnless({ guests: ["update"] });

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
