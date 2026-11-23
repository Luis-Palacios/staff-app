"use client";

import type { NotificationView } from "@/lib/notifications/view-types";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Popover, useMediaQuery } from "@heroui/react";
import { Skeleton } from "@heroui/react/skeleton";
import clsx from "clsx";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import {
  bellButtonClass,
  BellFace,
} from "@/components/notifications/bell-face";
import { NotificationRow } from "@/components/notifications/notification-row";
import { DoubleCheckIcon } from "@/components/icons";
import {
  loadNotifications,
  markAllNotificationsReadAction,
} from "@/app/(app)/_actions/in-app-notification-actions";
import { notifyNotificationsChanged } from "@/lib/notifications/use-unread-count";

/** Rule 11: the latest ten. */
const POPOVER_SIZE = 10;

type Status = "loading" | "ready" | "error";

function SkeletonRows() {
  return (
    <div aria-hidden="true" className="flex flex-col py-1">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-start gap-3 py-[11px] pr-4 pl-3.5">
          <Skeleton className="size-9 shrink-0 rounded-[10px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <Skeleton className="h-3.5 w-4/5 rounded" />
            <Skeleton className="h-3 w-3/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The bell as a button that opens the latest ten entries (rule 11), from 1024 px up; below that the
 * bell is a link (`NotificationBell`). Opening it reads the list and marks nothing read. *Mark all
 * read* marks everything, not only the ten shown, so it shows while the bell counts anything.
 */
export function NotificationPopover({
  label,
  unread,
}: {
  /** The bell's accessible name, with the count. */
  label: string;
  unread: number;
}) {
  const t = useTranslations("Notifications");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<NotificationView[]>([]);
  const [markFailed, setMarkFailed] = useState(false);
  const [isMarking, startMarking] = useTransition();
  const isDesktop = useMediaQuery("(min-width: 64rem)");

  // The button is hidden below 1024 px; an open popover would be left anchored to nothing.
  useEffect(() => {
    if (!isDesktop) setIsOpen(false);
  }, [isDesktop]);

  // Each read takes a number; only the latest one may write, so a slow reply (from an earlier
  // open or a *Try again*) never overwrites a newer list, and closing drops any read in flight.
  const latestRead = useRef(0);

  const load = useCallback(() => {
    const read = ++latestRead.current;

    loadNotifications({ limit: POPOVER_SIZE })
      .then((result) => {
        if (read !== latestRead.current) return;

        if (result.ok) {
          setItems(result.page.items);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (read === latestRead.current) setStatus("error");
      });
  }, []);

  // Reads the list each time it opens, so it is never older than the click.
  useEffect(() => {
    if (!isOpen) return;

    setStatus((current) => (current === "ready" ? current : "loading"));
    setMarkFailed(false);
    load();

    return () => {
      latestRead.current += 1;
    };
  }, [isOpen, load]);

  function reload() {
    setStatus("loading");
    load();
  }

  function markAll() {
    setMarkFailed(false);
    startMarking(async () => {
      try {
        const result = await markAllNotificationsReadAction();

        if (result.ok) {
          setItems((current) =>
            current.map((item) => ({ ...item, unread: false })),
          );
          notifyNotificationsChanged();
        } else {
          setMarkFailed(true);
        }
      } catch {
        setMarkFailed(true);
      }
    });
  }

  return (
    <Popover.Root isOpen={isOpen} onOpenChange={setIsOpen}>
      <button
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={label}
        className={clsx(bellButtonClass, "max-lg:hidden")}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <BellFace unread={unread} />
      </button>
      <Popover.Content
        className="w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-overlay-border bg-surface shadow-overlay-menu"
        offset={8}
        placement="bottom end"
        shouldCloseOnInteractOutside={(element) =>
          !triggerRef.current?.contains(element)
        }
        triggerRef={triggerRef}
      >
        <Popover.Dialog
          aria-label={t("title")}
          className="flex flex-col p-0 outline-none"
        >
          <div className="flex items-center justify-between gap-3 border-b border-separator py-3 pr-2.5 pl-[18px]">
            <h2 className="text-[15.5px] font-semibold text-heading">
              {t("title")}
            </h2>
            {unread > 0 && (
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13.5px] font-semibold text-link hover:bg-surface-secondary disabled:opacity-60"
                disabled={isMarking}
                type="button"
                onClick={markAll}
              >
                <DoubleCheckIcon className="size-4" />
                {t("markAll")}
              </button>
            )}
          </div>
          {markFailed && (
            <p
              className="border-b border-separator px-[18px] py-2 text-[13px] text-danger"
              role="alert"
            >
              {t("markAllFailed")}
            </p>
          )}
          {status === "loading" && <SkeletonRows />}
          {status === "error" && (
            <div className="flex flex-col items-start gap-2 px-[18px] py-5">
              <p className="text-[13.5px] text-danger" role="alert">
                {t("loadFailed")}
              </p>
              <button
                className="text-sm font-semibold text-link underline decoration-gold-500 underline-offset-4"
                type="button"
                onClick={reload}
              >
                {t("retry")}
              </button>
            </div>
          )}
          {status === "ready" && items.length > 0 && (
            <ul className="m-0 max-h-[452px] list-none overflow-y-auto p-0 py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationRow
                    item={item}
                    variant="popover"
                    onNavigate={() => setIsOpen(false)}
                  />
                </li>
              ))}
            </ul>
          )}
          {status === "ready" && items.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 pt-7 pb-[30px] text-center">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-tile bg-success-soft text-success-soft-foreground"
              >
                <CheckCircleIcon className="size-5" strokeWidth={1.7} />
              </span>
              <span className="text-[15px] font-semibold text-heading">
                {t("emptyTitle")}
              </span>
              <span className="max-w-[300px] text-[13.5px] leading-normal text-muted">
                {t("emptyBody")}
              </span>
            </div>
          )}
          <NextLink
            className="flex h-12 items-center justify-center gap-1.5 border-t border-separator text-sm font-semibold text-link hover:bg-surface-secondary"
            href="/notifications"
            prefetch={false}
            onClick={() => setIsOpen(false)}
          >
            {t("seeAll")}
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
          </NextLink>
        </Popover.Dialog>
      </Popover.Content>
    </Popover.Root>
  );
}
