"use client";

import type { ReactNode } from "react";

import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  removePushSubscription,
  savePushSubscription,
} from "@/app/(app)/_actions/push-actions";
import {
  base64UrlToBytes,
  getPushRegistration,
  isIosNotInstalled,
  isPushSupported,
  toSubscriptionInput,
  usesKey,
} from "@/lib/push/browser";

type DeviceState =
  /** Not looked at yet (server render and first paint): the row shows only its heading. */
  "checking" | "unsupported" | "ios" | "ask" | "on" | "blocked";

const iconProps = {
  "aria-hidden": true,
  className: "size-5 shrink-0",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
} as const;

function StatusLine({
  icon,
  tone,
  children,
}: {
  icon: ReactNode;
  tone: string;
  children: ReactNode;
}) {
  return (
    <p className="m-0 flex items-start gap-2.5 text-[14px] leading-[1.55] text-foreground">
      <span className={`mt-px ${tone}`}>{icon}</span>
      <span>{children}</span>
    </p>
  );
}

/**
 * My profile's *This device* row (notifications rule 22): one state at a time, from what this
 * browser can do and what it has been allowed. `publicKey` is auth-server's VAPID public key; the
 * parent leaves the row out while push is off at the server.
 *
 * Nothing here asks for anything on load (rule 19): the browser's prompt appears only inside the
 * *Turn on* tap, as its first step (iOS requires the gesture). A device that is already on is
 * registered with auth-server again on load, which keeps its row fresh and moves it to this user
 * when someone else was signed in here (rule 9).
 */
export function PushDeviceRow({ publicKey }: { publicKey: string }) {
  const t = useTranslations("NotificationSettings");
  const [state, setState] = useState<DeviceState>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only the first look registers again; later looks (window focus) just read the state.
  const synced = useRef(false);

  const look = useCallback(async (): Promise<DeviceState> => {
    if (isIosNotInstalled()) return "ios";
    if (!isPushSupported()) return "unsupported";
    if (Notification.permission === "denied") return "blocked";
    // "default" still has no subscription to find; skip the service worker for it.
    if (Notification.permission !== "granted") return "ask";

    try {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();
      const key = base64UrlToBytes(publicKey);

      // Granted but not subscribed (turned off here, or the browser dropped it) or made with
      // another key: show *Turn on*. It needs no prompt now, and subscribing again silently would
      // undo a *Turn off*.
      if (!subscription || !usesKey(subscription, key)) return "ask";

      if (!synced.current) {
        synced.current = true;

        const input = toSubscriptionInput(subscription);

        // Best effort: a failure here leaves the device as it was; *Turn off* still works.
        if (input) await savePushSubscription(input).catch(() => {});
      }

      return "on";
    } catch {
      return "ask";
    }
  }, [publicKey]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const next = await look();

      if (!cancelled) setState(next);
    }

    void refresh();
    // Someone who went to the browser's settings to allow notifications comes back to this tab.
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [look]);

  async function turnOn() {
    setBusy(true);
    setError(null);

    let created: PushSubscription | null = null;

    try {
      // First, with nothing awaited before it: iOS only shows the prompt inside the tap's gesture.
      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        setState("blocked");

        return;
      }

      // Dismissed without choosing: stay as we are, ask again on the next tap.
      if (permission !== "granted") return;

      const registration = await getPushRegistration();
      const key = base64UrlToBytes(publicKey);
      let subscription = await registration.pushManager.getSubscription();

      // A subscription made with another key can't receive what auth-server sends now.
      if (subscription && !usesKey(subscription, key)) {
        await subscription.unsubscribe();
        subscription = null;
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
      }

      created = subscription;

      const input = toSubscriptionInput(subscription);
      const result = input ? await savePushSubscription(input) : null;

      if (!result?.ok) {
        await subscription.unsubscribe().catch(() => {});
        setError(t("deviceTurnOnFailed"));

        return;
      }

      synced.current = true;
      setState("on");
    } catch {
      await created?.unsubscribe().catch(() => {});
      setError(t("deviceTurnOnFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError(null);

    try {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Server first: if it fails the device is still on, and says so, rather than leaving a row
        // at auth-server that keeps sending here.
        const result = await removePushSubscription(subscription.endpoint);

        if (!result.ok) {
          setError(t("deviceTurnOffFailed"));

          return;
        }

        await subscription.unsubscribe();
      }

      setState("ask");
    } catch {
      setError(t("deviceTurnOffFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-separator bg-surface-secondary px-6 pt-4 pb-4.5">
      <h3 className="text-[15px] font-semibold text-heading">
        {t("deviceTitle")}
      </h3>
      {state === "ask" && (
        <div className="flex">
          <Button
            className="min-h-11 max-w-full gap-2 rounded-[10px] px-4 text-start text-[14px] leading-[1.35] font-semibold"
            isPending={busy}
            onPress={turnOn}
          >
            <svg {...iconProps} className="size-[18px] shrink-0">
              <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            <span>{t("deviceTurnOn")}</span>
          </Button>
        </div>
      )}
      {state === "on" && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-2 text-[15px] font-medium text-heading">
            <svg
              {...iconProps}
              className="size-5 shrink-0 text-success-soft-foreground"
            >
              <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{t("deviceOn")}</span>
          </span>
          <Button
            className="min-h-11 rounded-[10px] px-4 text-[14px] font-semibold whitespace-nowrap"
            isPending={busy}
            variant="outline"
            onPress={turnOff}
          >
            {t("deviceTurnOff")}
          </Button>
        </div>
      )}
      {state === "blocked" && (
        <StatusLine
          icon={
            <svg {...iconProps}>
              <path d="M9.143 17.082a24.248 24.248 0 0 0 3.844.148m-3.844-.148a23.856 23.856 0 0 1-5.455-1.31 8.964 8.964 0 0 0 2.3-5.542m3.155 6.852a3 3 0 0 0 5.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 0 0 3.536-1.003A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" />
            </svg>
          }
          tone="text-warning-soft-foreground"
        >
          {t("deviceBlocked")}
        </StatusLine>
      )}
      {state === "unsupported" && (
        <StatusLine
          icon={
            <svg {...iconProps}>
              <path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
          tone="text-muted"
        >
          {t("deviceUnsupported")}
        </StatusLine>
      )}
      {state === "ios" && (
        <StatusLine
          icon={
            <svg {...iconProps}>
              <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
          }
          tone="text-muted"
        >
          {t.rich("deviceIosHint", {
            b: (chunks) => (
              <strong className="font-semibold text-heading">{chunks}</strong>
            ),
            share: () => (
              <svg
                {...iconProps}
                className="mx-px ms-1 inline-block size-4 align-[-3px] text-heading"
              >
                <path d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
              </svg>
            ),
          })}
        </StatusLine>
      )}
      {error && (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
