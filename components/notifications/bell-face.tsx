import { BellIcon } from "@heroicons/react/24/outline";

/** Rule 11: 1–99, then "99+"; nothing at 0. */
export function formatBellCount(unread: number): string {
  return unread > 99 ? "99+" : String(unread);
}

// The 44px target, as the top bar's other icon buttons. `aria-expanded` is the open popover.
export const bellButtonClass =
  "group relative flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary aria-expanded:bg-surface-secondary aria-expanded:text-heading";

/**
 * The bell and its gold count. The ring is the bar's own colour so the count reads as cut out of
 * the icon; it follows the button's tint while hovered or open. The count is hidden from assistive
 * technology: the button's label says it.
 */
export function BellFace({ unread }: { unread: number }) {
  return (
    <>
      <BellIcon aria-hidden="true" className="size-[22px]" strokeWidth={1.7} />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-[3px] left-[21px] inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-gold-500 px-[5px] text-[11px] leading-none font-bold whitespace-nowrap text-navy-900 tabular-nums group-hover:border-surface-secondary group-aria-expanded:border-surface-secondary"
        >
          {formatBellCount(unread)}
        </span>
      )}
    </>
  );
}
