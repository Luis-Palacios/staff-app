import type { ReactNode } from "react";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Table, buttonVariants } from "@heroui/react";
import NextLink from "next/link";
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

const smallOutlineButton =
  "h-[34px] rounded-control px-3 text-[13px] font-semibold text-heading md:h-[34px]";

// Avatar + linked name + muted secondary line. Use it in the row-header column.
export function DataTablePrimaryCell({
  name,
  href,
  secondary,
}: {
  name: string;
  href: string;
  secondary?: ReactNode;
}) {
  return (
    <span className="flex items-center gap-3">
      <InitialsAvatar name={name} />
      <span className="flex min-w-0 flex-col whitespace-nowrap">
        <NextLink
          className="text-[14.5px] font-semibold text-heading hover:underline"
          href={href}
        >
          {name}
        </NextLink>
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
      Open
      <ChevronRightIcon
        aria-hidden="true"
        className="size-3.5"
        strokeWidth={2}
      />
    </NextLink>
  );
}

// "Showing X–Y of Z" + Previous/Next. Render it as a direct child of <Table>,
// after Table.ScrollContainer.
// TODO: the APIs don't paginate yet, so every list fits on one page and both
// buttons stay disabled. Wire them up once there's a page/cursor parameter.
export function DataTableFooter({ total }: { total: number }) {
  const { footer } = dataTable();

  return (
    <Table.Footer className={footer()}>
      <span>
        {total === 0 ? "No results" : `Showing 1–${total} of ${total}`}
      </span>
      <span className="flex gap-2">
        <button
          disabled
          className={buttonVariants({
            size: "sm",
            variant: "outline",
            className: smallOutlineButton,
          })}
          type="button"
        >
          Previous
        </button>
        <button
          disabled
          className={buttonVariants({
            size: "sm",
            variant: "outline",
            className: smallOutlineButton,
          })}
          type="button"
        >
          Next
        </button>
      </span>
    </Table.Footer>
  );
}
