"use client";

import type {
  ConversationInbox,
  ConversationInboxTab,
} from "@/api/conversations-api/types";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button, Label, ListBox, Select } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { ConversationRow } from "./conversation-row";

import { listConversationsAction } from "@/app/(app)/groups/reports/_actions/conversation-actions";
import { card } from "@/components/primitives";
import { EmptyState } from "@/components/empty-state";
import { StatusTabs } from "@/components/status-tabs";

const PAGE_SIZE = 25;
const ALL_GROUPS = "all";
const TABS = ["reply", "unread", "open", "resolved"] as const;
const TAB_LABELS = {
  reply: "tabReply",
  unread: "tabUnread",
  open: "tabOpen",
  resolved: "tabResolved",
} as const;

export interface ConversationGroupOption {
  id: number;
  name: string;
  closed: boolean;
}

// The rows of one tab and group. Keyed by both in the parent, so changing either starts over; the
// first page comes from the server and "Show more" asks for the next 25.
function ConversationList({
  data,
  tab,
  groupId,
  timeZone,
  elder,
}: {
  data: ConversationInbox;
  tab: ConversationInboxTab;
  groupId: number | null;
  timeZone: string;
  elder: boolean;
}) {
  const t = useTranslations("Conversations");
  const [items, setItems] = useState(data.items);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function showMore() {
    startTransition(async () => {
      const result = await listConversationsAction({
        tab,
        ...(groupId !== null && { smallGroupId: groupId }),
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

    return <p className="py-6 text-sm text-muted">{t("emptyOther")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
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

// Tabs and the group filter live in the URL (`?tab=` and `?group=`), so a view can be linked and the
// back button works. A change runs in a transition: the current rows stay until the new ones arrive.
export function ConversationsBrowser({
  data,
  tab,
  groupId,
  groups,
  timeZone,
  elder,
}: {
  data: ConversationInbox;
  tab: ConversationInboxTab;
  groupId: number | null;
  groups: ConversationGroupOption[];
  timeZone: string;
  /** Full roles see every group; leaders their own. Words the copy. */
  elder: boolean;
}) {
  const t = useTranslations("Conversations");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

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
          onChange={(next) => update({ tab: next === "reply" ? null : next })}
        />
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
      </div>
      {tab === "unread" && data.items.length > 0 && (
        <p className="-mt-1 max-w-[680px] text-[13.5px] leading-normal text-muted">
          {elder ? t("unreadHintElder") : t("unreadHintLeader")}
        </p>
      )}
      <div
        aria-busy={isPending}
        className={isPending ? "opacity-60 transition-opacity" : undefined}
      >
        <ConversationList
          key={`${tab}-${groupId ?? "all"}`}
          data={data}
          elder={elder}
          groupId={groupId}
          tab={tab}
          timeZone={timeZone}
        />
      </div>
    </div>
  );
}
