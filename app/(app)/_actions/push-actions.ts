"use server";

import type { PushSubscriptionInput } from "@/api/auth-api/types";

import {
  deletePushSubscription,
  incomingForwardedRequest,
  putPushSubscription,
} from "@/api/auth-api/client";
import { getApiErrorMessage } from "@/lib/api-error-message";

export type PushSaveResult = { ok: true } | { ok: false; message: string };

function isSubscription(value: unknown): value is PushSubscriptionInput {
  const input = value as Partial<PushSubscriptionInput> | null;

  return (
    typeof input?.endpoint === "string" &&
    typeof input.keys?.p256dh === "string" &&
    typeof input.keys.auth === "string"
  );
}

/**
 * Registers this browser's push subscription for the signed-in user (*Turn on*, and again on every
 * load of My profile while the device is on). Moves it when another user had it (rule 9). The
 * endpoint and keys go to auth-server exactly as `subscription.toJSON()` gave them.
 */
export async function savePushSubscription(
  subscription: PushSubscriptionInput,
): Promise<PushSaveResult> {
  if (!isSubscription(subscription)) {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  try {
    await putPushSubscription(await incomingForwardedRequest(), {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, message: await getApiErrorMessage(error) };
  }
}

/** Deletes this browser's subscription at auth-server (*Turn off* and sign-out, rule 23). Idempotent. */
export async function removePushSubscription(
  endpoint: string,
): Promise<PushSaveResult> {
  if (typeof endpoint !== "string" || endpoint === "") {
    return { ok: false, message: await getApiErrorMessage(null) };
  }

  try {
    await deletePushSubscription(await incomingForwardedRequest(), endpoint);

    return { ok: true };
  } catch (error) {
    return { ok: false, message: await getApiErrorMessage(error) };
  }
}
