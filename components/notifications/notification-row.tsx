"use client";

import type {
  NotificationKind,
  NotificationView,
} from "@/lib/notifications/view-types";
import type { ComponentType, SVGProps } from "react";

import {
  CalendarIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ClockIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";

// The kind's icon and tile colours, as the boards draw them: the same soft pairs the status badges use.
const KINDS: Record<
  NotificationKind,
  { icon: ComponentType<SVGProps<SVGSVGElement>>; tile: string }
> = {
  conversation: {
    icon: ChatBubbleOvalLeftEllipsisIcon,
    tile: "bg-accent-soft text-accent-soft-foreground",
  },
  submitted: {
    icon: DocumentCheckIcon,
    tile: "bg-success-soft text-success-soft-foreground",
  },
  noMeeting: { icon: CalendarIcon, tile: "bg-separator text-foreground" },
  reminder: {
    icon: ClockIcon,
    tile: "bg-warning-soft text-warning-soft-foreground",
  },
};

/** Where every entry opens (rule 15): the route marks it read and redirects. Never prefetched, so
 *  that a visible row doesn't mark anything read. */
export function notificationHref(id: number): string {
  return `/notifications/open/${id}`;
}

/**
 * One entry: the kind's icon, a title and a secondary line, the time and, while unread, a gold dot
 * (with bolder text, so unread is never colour alone). `popover` is the narrower popover row,
 * `page` the `/notifications` one.
 */
export function NotificationRow({
  item,
  variant,
  onNavigate,
}: {
  item: NotificationView;
  variant: "page" | "popover";
  /** Called when the link is followed, so a popover can close. */
  onNavigate?: () => void;
}) {
  const { icon: Icon, tile } = KINDS[item.kind];
  const popover = variant === "popover";

  return (
    <NextLink
      aria-label={item.label}
      className={clsx(
        "flex items-start text-inherit hover:bg-surface-secondary",
        popover
          ? "gap-3 py-[11px] pr-4 pl-3.5"
          : "gap-3.5 px-3.5 py-3.5 sm:px-[22px] sm:py-4",
        item.unread && "bg-focus-row hover:bg-focus-row",
      )}
      href={notificationHref(item.id)}
      prefetch={false}
      onClick={onNavigate}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "flex shrink-0 items-center justify-center",
          popover ? "size-9 rounded-[10px]" : "size-10 rounded-tile",
          tile,
        )}
      >
        <Icon
          className={popover ? "size-[19px]" : "size-5"}
          strokeWidth={1.7}
        />
      </span>
      <span
        className={clsx(
          "flex min-w-0 flex-1 flex-col",
          popover ? "gap-[3px]" : "gap-1 pt-px",
        )}
      >
        <span
          className={clsx(
            "text-heading",
            item.unread ? "font-semibold" : "font-medium",
            popover
              ? "line-clamp-2 text-sm leading-[1.35]"
              : "text-[15px] leading-[1.4]",
          )}
        >
          {item.title}
        </span>
        <span
          className={clsx(
            "text-muted",
            popover
              ? "truncate text-[12.5px] leading-[1.4]"
              : "text-[13.5px] leading-[1.45]",
          )}
        >
          {item.secondary}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={clsx(
          "flex shrink-0 flex-col items-end pt-0.5",
          popover ? "gap-2" : "gap-[9px] pt-[3px]",
        )}
      >
        <span
          className={clsx(
            "whitespace-nowrap",
            popover ? "text-xs" : "text-[12.5px]",
            item.unread ? "font-bold text-heading" : "font-medium text-muted",
          )}
        >
          {popover ? item.short : item.time}
        </span>
        {item.unread && (
          <span
            className={clsx(
              "rounded-full bg-gold-500",
              popover ? "size-2" : "size-[9px]",
            )}
          />
        )}
      </span>
    </NextLink>
  );
}
