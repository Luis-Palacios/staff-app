"use server";

import type { GuestSearchItem } from "@/api/guests-api/types";
import type {
  AddGuestInput,
  OtherGroup,
  RemoveGuestInput,
} from "@/api/small-groups-api/types";
import type { GuestErrorKind } from "@/lib/guest-errors";

import { revalidatePath } from "next/cache";

import { searchGuests } from "@/api/guests-api/client";
import {
  addSmallGroupGuest,
  removeSmallGroupGuest,
} from "@/api/small-groups-api/client";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { forbiddenUnless } from "@/lib/auth/get-permissions";
import { getGuestErrorKind, getOtherGroup } from "@/lib/guest-errors";

export interface GuestActionFailure {
  ok: false;
  error?: GuestErrorKind;
  /** With `inAnotherGroup`: where the guest is now, so the UI can ask to move them. */
  otherGroup?: OtherGroup;
  message?: string;
}

export type GuestActionResult = { ok: true } | GuestActionFailure;

/** `guestId` is the added guest, new or existing. */
export type AddGuestResult = { ok: true; guestId: number } | GuestActionFailure;

async function toFailure(error: unknown): Promise<GuestActionFailure> {
  const kind = getGuestErrorKind(error);

  if (kind) {
    return {
      ok: false,
      error: kind,
      otherGroup: getOtherGroup(error) ?? undefined,
    };
  }

  return { ok: false, message: await getApiErrorMessage(error) };
}

function revalidateGroup(groupId: string) {
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  revalidatePath("/guests");
}

/** Church-wide search for the add dialog; the API returns [] for a short query or a caller who can't. */
export async function searchGuestsAction(
  query: string,
): Promise<
  { ok: true; guests: GuestSearchItem[] } | { ok: false; message: string }
> {
  const forbidden = await forbiddenUnless({ guests: ["search"] });

  if (forbidden) {
    return { ok: false, message: await getApiErrorMessage(forbidden) };
  }

  try {
    return { ok: true, guests: await searchGuests(query.trim()) };
  } catch (error) {
    return { ok: false, message: await getApiErrorMessage(error) };
  }
}

/**
 * Adds an existing guest, or a new one, to a guest group. 409 `in another group` comes back with
 * `otherGroup`; the UI asks, then calls again with `moveFromOtherGroup: true`.
 */
export async function addGuestAction(
  groupId: string,
  input: AddGuestInput,
): Promise<AddGuestResult> {
  const forbidden = await forbiddenUnless({
    smallGroups: ["manageMembers"],
    ...(input.newGuest && { guests: ["create"] }),
  });

  if (forbidden) {
    return { ok: false, message: await getApiErrorMessage(forbidden) };
  }

  let guestId: number;

  try {
    ({ guestId } = await addSmallGroupGuest(groupId, input));
  } catch (error) {
    return toFailure(error);
  }

  revalidateGroup(groupId);

  return { ok: true, guestId };
}

/** Ends the guest's period, today unless `leftAt` is given. */
export async function removeGuestAction(
  groupId: string,
  guestId: number,
  input: RemoveGuestInput,
): Promise<GuestActionResult> {
  const forbidden = await forbiddenUnless({ smallGroups: ["manageMembers"] });

  if (forbidden) {
    return { ok: false, message: await getApiErrorMessage(forbidden) };
  }

  try {
    await removeSmallGroupGuest(groupId, guestId, input);
  } catch (error) {
    return toFailure(error);
  }

  revalidateGroup(groupId);

  return { ok: true };
}
