// Browser-side Web Push helpers (notifications Part 2). Client code only: nothing here runs on the
// server, and every function guards the APIs it touches.

import type { PushSubscriptionInput } from "@/api/auth-api/types";

/** The browser has everything push needs: service workers, the Push API and Notification. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * iPhone or iPad where the app isn't installed to the Home Screen, so push can't work (rule 22).
 * iOS Safari only offers push to an installed web app. iPadOS reports itself as a Mac, so a "Mac"
 * with a touch screen counts as an iPad.
 */
export function isIosNotInstalled(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const iPhoneOrIPad = /iPhone|iPad|iPod/.test(ua);
  const iPadOnMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;

  if (!iPhoneOrIPad && !iPadOnMac) return false;

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return !standalone;
}

/** The VAPID public key (base64url) as the bytes `subscribe()` wants. */
export function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/** Whether a subscription was made with this key (`options.applicationServerKey` is its bytes). */
export function usesKey(
  subscription: PushSubscription,
  key: Uint8Array,
): boolean {
  const existing = subscription.options.applicationServerKey;

  if (!existing) return false;

  const bytes = new Uint8Array(existing);

  return bytes.length === key.length && bytes.every((b, i) => b === key[i]);
}

/**
 * The service worker registration, ready. `register` is idempotent, so this also covers a page
 * that loaded before the shell's own registration finished, or one where it failed earlier.
 */
export async function getPushRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });

  return navigator.serviceWorker.ready;
}

/** `subscription.toJSON()`'s endpoint and keys, as they are; `null` when it lacks either. */
export function toSubscriptionInput(
  subscription: PushSubscription,
): PushSubscriptionInput | null {
  const { endpoint, keys } = subscription.toJSON();

  if (!endpoint || !keys?.p256dh || !keys.auth) return null;

  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}
