"use client";

import type {
  ConversationInbox,
  ConversationInboxTab,
} from "@/api/conversations-api/types";
import type { ResolvedPeriod } from "@/lib/resolved-period";
import type { SVGProps } from "react";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button, Label, ListBox, Select } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { ConversationRow } from "./conversation-row";

import {
  listConversationsAction,
  markAllConversationsReadAction,
} from "@/app/(app)/groups/reports/_actions/conversation-actions";
import { card } from "@/components/primitives";
import { EmptyState } from "@/components/empty-state";
import { StatusTabs } from "@/components/status-tabs";
import { showToast } from "@/components/toast-host";
import {
  DEFAULT_RESOLVED_PERIOD,
  RESOLVED_PERIODS,
} from "@/lib/resolved-period";

const PAGE_SIZE = 25;
const ALL_GROUPS = "all";
const TABS = ["reply", "unread", "open", "resolved"] as const;
const TAB_LABELS = {
  reply: "tabReply",
  unread: "tabUnread",
  open: "tabOpen",
  resolved: "tabResolved",
} as const;
const PERIOD_LABELS = {
  "30d": "period30d",
  "3m": "period3m",
  year: "periodYear",
  all: "periodAll",
} as const;
// Rule 15 (Part 1d): the list's own number, from `total`; the tab's badge stays all time.
const RESOLVED_COUNT = {
  "30d": "resolvedCount30d",
  "3m": "resolvedCount3m",
  year: "resolvedCountYear",
  all: "resolvedCountAll",
} as const;
const EMPTY_RESOLVED = {
  "30d": "emptyResolved30d",
  "3m": "emptyResolved3m",
  year: "emptyResolvedYear",
} as const;

// Two ticks, as on the canvas: Heroicons has no "read" double check.
function DoubleCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="m2.25 12.75 4.5 4.5 9-10.5M10.5 15.75l1.5 1.5 9.75-10.5" />
    </svg>
  );
}

export interface ConversationGroupOption {
  id: number;
  name: string;
  closed: boolean;
}

// The rows of one tab, group and period. Keyed by all three in the parent, so changing any starts
// over; the first page comes from the server and "Show more" asks for the next 25, with the same
// `resolvedSince` instant as the first page.
function ConversationList({
  data,
  tab,
  groupId,
  period,
  resolvedSince,
  timeZone,
  elder,
}: {
  data: ConversationInbox;
  tab: ConversationInboxTab;
  groupId: number | null;
  period: ResolvedPeriod | null;
  resolvedSince: string | null;
  timeZone: string;
  elder: boolean;
}) {
  const t = useTranslations("Conversations");
  const [items, setItems] = useState(data.items);
  const [shown, setShown] = useState(data);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New server data for the same tab and group (after *Mark all as read*, or any revalidation)
  // starts the list over from its first page.
  if (shown !== data) {
    setShown(data);
    setItems(data.items);
    setFailed(false);
  }

  function showMore() {
    startTransition(async () => {
      const result = await listConversationsAction({
        tab,
        ...(groupId !== null && { smallGroupId: groupId }),
        ...(resolvedSince !== null && { resolvedSince }),
        limit: PAGE_SIZE,
        offset: items.length,
      });

      if (result.ok) {
        setFailed(false);
        setItems((current) => [...current, ...result.inbox.items]);
      } else {
        setFailed(true);
      }
    });
  }

  if (items.length === 0) {
    if (tab === "reply" || tab === "unread") {
      return (
        <EmptyState
          action={
            <NextLink
              className="text-sm font-semibold text-link underline decoration-gold-500 underline-offset-4"
              href="?tab=open"
            >
              {t("seeOpen")}
            </NextLink>
          }
          icon={CheckCircleIcon}
          title={tab === "unread" ? t("emptyUnreadTitle") : t("emptyTitle")}
        >
          {tab === "unread"
            ? t("emptyUnread")
            : elder
              ? t("emptyElder")
              : t("emptyLeader")}
        </EmptyState>
      );
    }

    if (period !== null && period !== "all") {
      const allTime = new URLSearchParams({ tab: "resolved", period: "all" });

      if (groupId !== null) allTime.set("group", String(groupId));

      return (
        <p className="py-6 text-sm text-muted">
          {t(EMPTY_RESOLVED[period])}{" "}
          <NextLink
            className="font-semibold text-link underline decoration-gold-500 underline-offset-4"
            href={`?${allTime}`}
          >
            {t("seeAllTime")}
          </NextLink>
        </p>
      );
    }

    return <p className="py-6 text-sm text-muted">{t("emptyOther")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {period !== null && (
        <p className="text-[13.5px] leading-normal text-muted">
          {t(RESOLVED_COUNT[period], { count: data.total })}
        </p>
      )}
      <ul
        className={card({
          className: "divide-y divide-separator overflow-hidden",
        })}
      >
        {items.map((item) => (
          <li key={item.id}>
            <ConversationRow
              guests={item.group.audience === "guests"}
              item={item}
              timeZone={timeZone}
            />
          </li>
        ))}
      </ul>
      {failed && (
        <p className="text-sm text-danger" role="alert">
          {t("listError")}
        </p>
      )}
      {items.length < data.total && (
        <Button
          className="w-full font-semibold sm:w-auto sm:self-start"
          isPending={isPending}
          variant="outline"
          onPress={showMore}
        >
          {t("showMore")}
        </Button>
      )}
    </div>
  );
}

// Tabs and the filters live in the URL (`?tab=`, `?group=`, and on Resolved `?period=`), so a view can
// be linked and the back button works. A change runs in a transition: the current rows stay until the new ones arrive.
export function ConversationsBrowser({
  data,
  tab,
  groupId,
  period,
  resolvedSince,
  groups,
  timeZone,
  elder,
}: {
  data: ConversationInbox;
  tab: ConversationInboxTab;
  groupId: number | null;
  /** The Resolved tab's period (rule 15, Part 1d); `null` on the other tabs. */
  period: ResolvedPeriod | null;
  /** The instant the page computed for `period`, reused by "Show more"; `null` for none. */
  resolvedSince: string | null;
  groups: ConversationGroupOption[];
  timeZone: string;
  /** Full roles see every group; leaders their own. Words the copy. */
  elder: boolean;
}) {
  const t = useTranslations("Conversations");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isMarking, startMarking] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const showMarkAll = tab === "unread" && data.items.length > 0;

  // The action revalidates, so the page comes back with the tab emptied and the count down; focus
  // moves to the list because the button it was on goes away.
  function markAllRead() {
    startMarking(async () => {
      const result = await markAllConversationsReadAction(groupId);

      if (result.ok) {
        showToast(t("markedToast", { count: result.marked }));
        listRef.current?.focus();
      } else {
        showToast(result.message, "danger");
      }
    });
  }

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(changes)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }

    const search = params.toString();

    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <StatusTabs
          ariaLabel={t("tabsLabel")}
          counts={data.counts}
          highlighted={["reply"]}
          options={TABS.map((key) => ({ key, label: t(TAB_LABELS[key]) }))}
          value={tab}
          onChange={(next) =>
            // A period belongs to Resolved only; the group is kept.
            update({ tab: next === "reply" ? null : next, period: null })
          }
        />
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end md:w-auto">
          {period !== null && (
            <Select.Root
              className="w-full gap-1.5 md:w-[200px]"
              selectedKey={period}
              onSelectionChange={(key) =>
                update({
                  period:
                    key === DEFAULT_RESOLVED_PERIOD || key === null
                      ? null
                      : String(key),
                })
              }
            >
              <Label className="text-[13px] font-semibold text-heading">
                {t("period")}
              </Label>
              <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {RESOLVED_PERIODS.map((key) => (
                    <ListBox.Item
                      key={key}
                      id={key}
                      textValue={t(PERIOD_LABELS[key])}
                    >
                      {t(PERIOD_LABELS[key])}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select.Root>
          )}
          <Select.Root
            className="w-full gap-1.5 md:w-[300px]"
            selectedKey={groupId === null ? ALL_GROUPS : String(groupId)}
            onSelectionChange={(key) =>
              update({
                group: key === ALL_GROUPS || key === null ? null : String(key),
              })
            }
          >
            <Label className="text-[13px] font-semibold text-heading">
              {t("group")}
            </Label>
            <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL_GROUPS} textValue={t("allGroups")}>
                  {elder ? t("allGroups") : t("allMyGroups")}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {groups.map((group) => {
                  const label = group.closed
                    ? `${group.name} · ${t("closed")}`
                    : group.name;

                  return (
                    <ListBox.Item
                      key={group.id}
                      id={String(group.id)}
                      textValue={label}
                    >
                      {label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </Select.Popover>
          </Select.Root>
          {showMarkAll && (
            <Button
              className="h-10 w-full shrink-0 rounded-control font-semibold sm:w-auto"
              isPending={isMarking}
              variant="outline"
              onPress={markAllRead}
            >
              <DoubleCheckIcon aria-hidden="true" className="size-[18px]" />
              {t("markAll")}
            </Button>
          )}
        </div>
      </div>
      {tab === "unread" && data.items.length > 0 && (
        <p className="-mt-1 max-w-[680px] text-[13.5px] leading-normal text-muted">
          {elder ? t("unreadHintElder") : t("unreadHintLeader")}
        </p>
      )}
      <div
        ref={listRef}
        aria-busy={isPending || isMarking}
        className={clsx(
          // Focusable for the moment after *Mark all as read*.
          "outline-none",
          (isPending || isMarking) && "opacity-60 transition-opacity",
        )}
        tabIndex={-1}
      >
        <ConversationList
          key={`${tab}-${groupId ?? "all"}-${period ?? "none"}`}
          data={data}
          elder={elder}
          groupId={groupId}
          period={period}
          resolvedSince={resolvedSince}
          tab={tab}
          timeZone={timeZone}
        />
      </div>
    </div>
  );
}
