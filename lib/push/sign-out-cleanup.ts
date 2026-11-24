import { removePushSubscription } from "@/app/(app)/_actions/push-actions";

// Longest sign-out waits for the cleanup. Signing out matters more than the cleanup.
const CLEANUP_TIMEOUT_MS = 4000;

async function removeCurrentSubscription(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  // getRegistration, not ready: it answers "none" at once instead of waiting for a worker that
  // was never registered.
  const registration = await navigator.serviceWorker.getRegistration("/");
  // iOS Safari outside an installed app has service workers but no pushManager.
  const subscription = await registration?.pushManager?.getSubscription();

  if (!subscription) return;

  // Server first (it needs the session, which is about to end), then the browser's own, which makes
  // the push service refuse further pushes for it. The browser's always runs, even when the server
  // call fails or throws: a stale server row then gets 410 from the push service on its next push
  // and auth-server deletes it, so the device never shows the old account's pushes (rule 9).
  try {
    await removePushSubscription(subscription.endpoint);
  } finally {
    await subscription.unsubscribe();
  }
}

/**
 * Stops this browser receiving pushes for the account that is signing out (notifications rule 23):
 * deletes the current subscription at auth-server, then `subscription.unsubscribe()`. Call it
 * before `authClient.signOut()`: the delete needs the session. Never throws and never waits long,
 * since any failure must not stop the sign-out; the server also drops a subscription when its push
 * service answers 404 or 410, and moves it to the next user who registers it (rule 9).
 */
export async function removePushSubscriptionBeforeSignOut(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      // Caught here too: if the timeout wins, a later failure would otherwise be an unhandled rejection.
      removeCurrentSubscription().catch(() => {}),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, CLEANUP_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // Swallowed on purpose.
  } finally {
    clearTimeout(timer);
  }
}
