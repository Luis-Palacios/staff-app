"use server";

import { revalidatePath } from "next/cache";

import { ApiError } from "@/api/api-client";
import {
  setGroupWatching,
  updateNotificationPreferences,
} from "@/api/notifications-api/client";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { forbiddenUnless, getPermissions } from "@/lib/auth/get-permissions";
import {
  WATCH_GROUPS_CHECK,
  canSeeConversationsInbox,
} from "@/lib/auth/permissions";

/** A switch's save: the value the server now holds, or text for the inline error. */
export type ToggleResult =
  | { ok: true; value: boolean }
  | { ok: false; message: string };

async function toFailure(error: unknown): Promise<ToggleResult> {
  return { ok: false, message: await getApiErrorMessage(error) };
}

/** My profile's "Conversation emails". The API takes any signed-in user; the switch only shows to
 *  people who can see conversations, so the action asks the same. */
export async function setConversationEmails(
  enabled: boolean,
): Promise<ToggleResult> {
  if (!canSeeConversationsInbox(await getPermissions())) {
    return toFailure(
      new ApiError({
        status: 403,
        statusText: "Forbidden",
        url: "",
        method: "",
        body: null,
      }),
    );
  }

  try {
    const preferences = await updateNotificationPreferences({
      conversationEmails: enabled,
    });

    // The group pages disable their Watching switch while this is off.
    revalidatePath("/users/me");
    revalidatePath("/groups/[id]", "page");

    return { ok: true, value: preferences.conversationEmails };
  } catch (error) {
    return toFailure(error);
  }
}

/** One group's Watching switch, from My profile or the group's page. */
export async function setWatching(
  groupId: number,
  watching: boolean,
): Promise<ToggleResult> {
  const forbidden = await forbiddenUnless(WATCH_GROUPS_CHECK);

  if (forbidden) return toFailure(forbidden);

  try {
    const result = await setGroupWatching(groupId, watching);

    revalidatePath("/users/me");
    revalidatePath(`/groups/${groupId}`);

    return { ok: true, value: result.watching };
  } catch (error) {
    return toFailure(error);
  }
}
