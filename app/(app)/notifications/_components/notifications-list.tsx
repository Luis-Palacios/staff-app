"use client";

import type {
  NotificationView,
  NotificationViewsPage,
} from "@/lib/notifications/view-types";

import { useMemo, useRef, useState, useTransition } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import {
  loadNotifications,
  markAllNotificationsReadAction,
} from "@/app/(app)/_actions/in-app-notification-actions";
import { EmptyState } from "@/components/empty-state";
import { DoubleCheckIcon } from "@/components/icons";
import { NotificationRow } from "@/components/notifications/notification-row";
import { card } from "@/components/primitives";
import { notifyNotificationsChanged } from "@/lib/notifications/use-unread-count";

interface Day {
  key: string;
  label: string;
  items: NotificationView[];
}

// The list arrives newest first, so a day's entries are next to each other.
function groupByDay(items: readonly NotificationView[]): Day[] {
  const days: Day[] = [];

  for (const item of items) {
    const last = days.at(-1);

    if (last && last.key === item.dayKey) {
      last.items.push(item);
    } else {
      days.push({ key: item.dayKey, label: item.dayLabel, items: [item] });
    }
  }

  return days;
}

/**
 * The `/notifications` list (rules 12 and 13): entries by day, unread ones marked, *Show more*
 * for the next page and *Mark all read*. The first page comes from the server; the rest from
 * `loadNotifications` with the last page's cursor. Every entry opens through
 * `/notifications/open/{id}`, which marks it read.
 */
export function NotificationsList({
  initial,
  pageSize,
  unread: initialUnread,
}: {
  initial: NotificationViewsPage;
  pageSize: number;
  /** Everything unread, not only what this page shows. */
  unread: number;
}) {
  const t = useTranslations("Notifications");
  const [items, setItems] = useState(initial.items);
  const [nextBefore, setNextBefore] = useState(initial.nextBefore);
  const [unread, setUnread] = useState(initialUnread);
  const [shown, setShown] = useState(initial);
  const [loadFailed, setLoadFailed] = useState(false);
  const [markFailed, setMarkFailed] = useState(false);
  const [isLoading, startLoading] = useTransition();
  const [isMarking, startMarking] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => groupByDay(items), [items]);

  // New server data (a revalidation) starts the list over from its first page.
  if (shown !== initial) {
    setShown(initial);
    setItems(initial.items);
    setNextBefore(initial.nextBefore);
    setUnread(initialUnread);
    setLoadFailed(false);
    setMarkFailed(false);
  }

  function showMore() {
    if (nextBefore === null) return;

    setLoadFailed(false);
    startLoading(async () => {
      try {
        const result = await loadNotifications({
          limit: pageSize,
          before: nextBefore,
        });

        if (result.ok) {
          setItems((current) => {
            const known = new Set(current.map((item) => item.id));

            return [
              ...current,
              ...result.page.items.filter((item) => !known.has(item.id)),
            ];
          });
          setNextBefore(result.page.nextBefore);
        } else {
          setLoadFailed(true);
        }
      } catch {
        setLoadFailed(true);
      }
    });
  }

  // The button leaves with the last unread entry, so focus moves to the list.
  function markAllRead() {
    setMarkFailed(false);
    startMarking(async () => {
      try {
        const result = await markAllNotificationsReadAction();

        if (result.ok) {
          setItems((current) =>
            current.map((item) => ({ ...item, unread: false })),
          );
          setUnread(0);
          notifyNotificationsChanged();
          listRef.current?.focus();
        } else {
          setMarkFailed(true);
        }
      } catch {
        setMarkFailed(true);
      }
    });
  }

  if (items.length === 0 && nextBefore === null) {
    return (
      <EmptyState
        className="max-w-[560px]"
        icon={CheckCircleIcon}
        title={t("emptyTitle")}
      >
        {t("emptyBody")}
      </EmptyState>
    );
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-[22px]">
      {unread > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-heading">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-gold-500"
            />
            {t("unreadLine", { count: String(unread) })}
          </span>
          <Button
            className="h-11 w-full shrink-0 rounded-control font-semibold sm:w-auto"
            isPending={isMarking}
            variant="outline"
            onPress={markAllRead}
          >
            <DoubleCheckIcon className="size-[18px]" />
            {t("markAll")}
          </Button>
        </div>
      )}
      {markFailed && (
        <p className="-mt-3 text-sm text-danger" role="alert">
          {t("markAllFailed")}
        </p>
      )}
      <div
        ref={listRef}
        aria-busy={isMarking}
        aria-label={t("listLabel")}
        className={clsx(
          "flex flex-col gap-[22px] outline-none",
          isMarking && "opacity-60 transition-opacity",
        )}
        role="region"
        tabIndex={-1}
      >
        {days.map((day) => (
          <section key={day.key} className="flex flex-col gap-2.5">
            <h2 className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">
              {day.label}
            </h2>
            <ul
              className={card({
                className: "divide-y divide-separator overflow-hidden",
              })}
            >
              {day.items.map((item) => (
                <li key={item.id}>
                  <NotificationRow item={item} variant="page" />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {loadFailed && (
        <p className="text-sm text-danger" role="alert">
          {t("loadFailed")}
        </p>
      )}
      {nextBefore !== null && (
        <div className="flex justify-center">
          <Button
            className="h-11 w-full rounded-control px-[22px] font-semibold sm:w-auto"
            isPending={isLoading}
            variant="outline"
            onPress={showMore}
          >
            {t("showMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
