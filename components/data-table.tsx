import type { ReactNode } from "react";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Table, buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { tv } from "tailwind-variants";

import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";

// Class helpers for HeroUI's Table, used with variant="secondary" (no grey
// frame or rounded header pill to undo). HeroUI's own styles sit in a CSS
// layer below Tailwind utilities, so these override them without !important.
// The outer columns get 22px of padding to line up with the card's edge.
export const dataTable = tv({
  slots: {
    root: card({ className: "overflow-hidden" }),
    column: [
      "rounded-none border-b border-border bg-surface-secondary/50 py-3",
      "text-xs font-semibold uppercase tracking-[0.06em] text-muted",
      "after:content-none first:pl-[22px] last:pr-[22px]",
    ],
    row: "[&:last-child>td]:border-b-0",
    cell: "border-b border-separator py-3 tabular-nums first:pl-[22px] last:pr-[22px]",
    footer: [
      "flex-wrap justify-between gap-3 border-t border-border px-[22px] py-3.5",
      "text-[13.5px] text-muted",
    ],
  },
});

// 34px outline button for row actions ("Open", "Cancel").
export const smallOutlineButton =
  "h-[34px] px-3 text-[13px] font-semibold text-heading md:h-[34px]";

// Avatar + name + muted secondary line. Use it in the row-header column. The
// name links to `href` when the row has a page of its own.
export function DataTablePrimaryCell({
  name,
  href,
  secondary,
  badge,
  mutedAvatar,
}: {
  name: string;
  href?: string;
  secondary?: ReactNode;
  /** Sits after the name, e.g. the *Inactive* badge. */
  badge?: ReactNode;
  mutedAvatar?: boolean;
}) {
  const nameClass = "text-[14.5px] font-semibold text-heading";

  return (
    <span className="flex items-center gap-3">
      <InitialsAvatar muted={mutedAvatar} name={name} />
      <span className="flex min-w-0 flex-col whitespace-nowrap">
        <span className="flex items-center gap-2">
          {href ? (
            <NextLink className={`${nameClass} hover:underline`} href={href}>
              {name}
            </NextLink>
          ) : (
            <span className={nameClass}>{name}</span>
          )}
          {badge}
        </span>
        {secondary && (
          <span className="text-[12.5px] text-muted">{secondary}</span>
        )}
      </span>
    </span>
  );
}

// Right-aligned "Open ›" row action. `label` names the target for screen
// readers, since every row's visible text is the same.
export function DataTableOpenLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const t = useTranslations("DataTable");

  return (
    <NextLink
      aria-label={label}
      className={buttonVariants({
        size: "sm",
        variant: "outline",
        className: `${smallOutlineButton} gap-1.5`,
      })}
      href={href}
    >
      {t("open")}
      <ChevronRightIcon
        aria-hidden="true"
        className="size-3.5"
        strokeWidth={2}
      />
    </NextLink>
  );
}

// "Showing X–Y of Z" + Previous/Next. Render it as a direct child of <Table>,
// after Table.ScrollContainer. Renders nothing when the list is empty, since
// the table's empty state already says so.
// Lists the APIs don't paginate pass only `total`, so both buttons stay
// disabled. A paged list passes `page`, `pageSize` and `onPageChange`.
export function DataTableFooter({
  total,
  page = 1,
  pageSize,
  onPageChange,
}: {
  total: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}) {
  const t = useTranslations("DataTable");
  const { footer } = dataTable();

  if (total === 0) return null;

  const size = pageSize ?? total;
  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  const buttonClass = buttonVariants({
    size: "sm",
    variant: "outline",
    className: smallOutlineButton,
  });

  return (
    <Table.Footer className={footer()}>
      <span>{t("showing", { start, end, total })}</span>
      <span className="flex gap-2">
        <button
          className={buttonClass}
          disabled={!onPageChange || page <= 1}
          type="button"
          onClick={() => onPageChange?.(page - 1)}
        >
          {t("previous")}
        </button>
        <button
          className={buttonClass}
          disabled={!onPageChange || end >= total}
          type="button"
          onClick={() => onPageChange?.(page + 1)}
        >
          {t("next")}
        </button>
      </span>
    </Table.Footer>
  );
}
