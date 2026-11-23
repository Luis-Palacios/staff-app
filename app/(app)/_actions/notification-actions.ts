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
  REPORT_REMINDER_CHECK,
  WATCH_GROUPS_CHECK,
  canSeeConversationsInbox,
  canWatchGroups,
} from "@/lib/auth/permissions";

/** A switch's save: the value the server now holds, or text for the inline error. */
export type ToggleResult =
  | { ok: true; value: boolean }
  | { ok: false; message: string };

async function toFailure(error: unknown): Promise<ToggleResult> {
  return { ok: false, message: await getApiErrorMessage(error) };
}

function forbidden(): Promise<ToggleResult> {
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

/** My profile's "Conversations" email switch. The API takes any signed-in user; the switch only
 *  shows to people who can see conversations, so the action asks the same. */
export async function setConversationEmails(
  enabled: boolean,
): Promise<ToggleResult> {
  if (!canSeeConversationsInbox(await getPermissions())) return forbidden();

  try {
    const preferences = await updateNotificationPreferences({
      email: { reportConversation: enabled },
    });

    // The group pages disable their Watching switch while both emails are off.
    revalidatePath("/users/me");
    revalidatePath("/groups/[id]", "page");

    return { ok: true, value: preferences.email.reportConversation };
  } catch (error) {
    return toFailure(error);
  }
}

/** My profile's "Submitted reports" email switch, for the watch audience only. */
export async function setSubmittedReportEmails(
  enabled: boolean,
): Promise<ToggleResult> {
  if (!canWatchGroups(await getPermissions())) return forbidden();

  try {
    const preferences = await updateNotificationPreferences({
      email: { reportSubmitted: enabled },
    });

    revalidatePath("/users/me");
    revalidatePath("/groups/[id]", "page");

    return { ok: true, value: preferences.email.reportSubmitted };
  } catch (error) {
    return toFailure(error);
  }
}

/** My profile's "Weekly report reminders" switch. The API takes any signed-in user; the switch
 *  shows to people who lead a group and can submit reports, so the action asks for the latter. */
export async function setReportReminderEmails(
  enabled: boolean,
): Promise<ToggleResult> {
  const denied = await forbiddenUnless(REPORT_REMINDER_CHECK);

  if (denied) return toFailure(denied);

  try {
    const preferences = await updateNotificationPreferences({
      email: { reportReminder: enabled },
    });

    // Independent of Watching (rule 14), so only My profile needs to refresh.
    revalidatePath("/users/me");

    return { ok: true, value: preferences.email.reportReminder };
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
