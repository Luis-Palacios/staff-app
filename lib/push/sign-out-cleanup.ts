import { removePushSubscription } from "@/app/(app)/_actions/push-actions";

// Longest sign-out waits for the cleanup. Signing out matters more than the cleanup.
const CLEANUP_TIMEOUT_MS = 4000;

async function removeCurrentSubscription(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  // getRegistration, not ready: it answers "none" at once instead of waiting for a worker that
  // was never registered.
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) return;

  // Server first, so a failure to reach it still leaves the browser's own subscription to retry
  // from; then the browser's, which stops the push service accepting pushes for it.
  await removePushSubscription(subscription.endpoint);
  await subscription.unsubscribe();
}

/**
 * Stops this browser receiving pushes for the account that is signing out (notifications rule 23):
 * deletes the current subscription at auth-server, then `subscription.unsubscribe()`. Call it
 * before `authClient.signOut()`: the delete needs the session. Never throws and never waits long,
 * since any failure must not stop the sign-out; the server also drops a subscription when its push
 * service answers 404 or 410, and moves it to the next user who registers it (rule 9).
 */
export async function removePushSubscriptionBeforeSignOut(): Promise<void> {
  try {
    await Promise.race([
      removeCurrentSubscription(),
      new Promise<void>((resolve) => setTimeout(resolve, CLEANUP_TIMEOUT_MS)),
    ]);
  } catch {
    // Swallowed on purpose.
  }
}
