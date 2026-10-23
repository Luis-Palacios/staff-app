"use client";

import { Dropdown } from "@heroui/react";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  UserCircleIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { tv } from "tailwind-variants";

// Same row styling as the member row menu.
const menuItem = tv({
  slots: {
    base: "h-10 min-h-0 gap-2.5 rounded-[10px] px-2.5 py-0 text-sm font-medium text-heading data-focused:bg-surface-secondary data-hovered:bg-surface-secondary",
    icon: "size-[18px] shrink-0 text-muted",
  },
  variants: {
    danger: {
      true: {
        base: "text-danger data-focused:bg-danger-soft data-hovered:bg-danger-soft",
        icon: "text-danger",
      },
    },
  },
});
const { base: item, icon: itemIcon } = menuItem();

// The ⋯ menu on a guest row: view, edit, remove. It only reports Remove; the card opens the dialog.
export function GuestRowMenu({
  guestId,
  name,
  canView,
  canEdit,
  canRemove,
  isDisabled,
  onRemove,
}: {
  guestId: number;
  name: string;
  canView: boolean;
  canEdit: boolean;
  canRemove: boolean;
  isDisabled: boolean;
  onRemove: () => void;
}) {
  const t = useTranslations("GuestRowMenu");
  const router = useRouter();

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={t("actionsFor", { name })}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-secondary hover:text-heading aria-expanded:bg-surface-secondary data-pressed:transform-none"
        isDisabled={isDisabled}
      >
        <EllipsisVerticalIcon
          aria-hidden="true"
          className="size-5"
          strokeWidth={1.8}
        />
      </Dropdown.Trigger>
      <Dropdown.Popover
        className="w-[240px] max-w-[calc(100vw-2rem)] rounded-[14px] border border-overlay-border bg-surface p-0 shadow-overlay-menu"
        offset={8}
        placement="bottom end"
      >
        <Dropdown.Menu
          aria-label={t("actionsFor", { name })}
          className="gap-0 p-1.5"
        >
          {canView ? (
            <Dropdown.Item
              className={item()}
              textValue={t("view")}
              onAction={() => router.push(`/guests/${guestId}`)}
            >
              <UserCircleIcon
                aria-hidden="true"
                className={itemIcon()}
                strokeWidth={1.8}
              />
              <span className="flex-1">{t("view")}</span>
            </Dropdown.Item>
          ) : null}
          {canEdit ? (
            <Dropdown.Item
              className={item()}
              textValue={t("edit")}
              onAction={() => router.push(`/guests/${guestId}/edit`)}
            >
              <PencilSquareIcon
                aria-hidden="true"
                className={itemIcon()}
                strokeWidth={1.8}
              />
              <span className="flex-1">{t("edit")}</span>
            </Dropdown.Item>
          ) : null}
          {canRemove ? (
            <Dropdown.Item
              className={item({ danger: true })}
              textValue={t("remove")}
              variant="danger"
              onAction={onRemove}
            >
              <UserMinusIcon
                aria-hidden="true"
                className={itemIcon({ danger: true })}
                strokeWidth={1.8}
              />
              <span className="flex-1">{t("remove")}</span>
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
