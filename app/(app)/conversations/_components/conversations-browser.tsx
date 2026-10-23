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
import { isPersonInboxItem } from "@/lib/conversation-format";
import { StatusTabs } from "@/components/status-tabs";

const PAGE_SIZE = 25;
const ALL_GROUPS = "all";
const TABS = ["reply", "open", "resolved"] as const;

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

  // `items` keeps every row so "Show more" asks from the right offset; only person rows render.
  const rows = items.filter(isPersonInboxItem);

  if (rows.length === 0 && items.length >= data.total) {
    if (tab === "reply") {
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
          title={t("emptyTitle")}
        >
          {elder ? t("emptyElder") : t("emptyLeader")}
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
        {rows.map((item) => (
          <li key={item.id}>
            <ConversationRow item={item} timeZone={timeZone} />
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <StatusTabs
          ariaLabel={t("tabsLabel")}
          counts={data.counts}
          highlighted={["reply"]}
          options={TABS.map((key) => ({
            key,
            label: t(
              key === "reply"
                ? "tabReply"
                : key === "open"
                  ? "tabOpen"
                  : "tabResolved",
            ),
          }))}
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
