"use client";

import type { ChurchContext, Ministry } from "@/config/site";

import { useTransition } from "react";
import { Dropdown } from "@heroui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

import { switchChurch } from "@/app/(app)/_actions/switch-church";
import { pathAfterChurchSwitch } from "@/lib/path-after-church-switch";

type MinistryMarkProps = {
  ministry: Ministry;
  /** Diameter in px. */
  size?: number;
  /** Surface the mark sits on: the navy rail, or a themed surface such as
   *  the church menu (white in light mode, navy-800 in dark). */
  tone?: "on-dark" | "on-light";
  className?: string;
};

// On the rail, the logo gets a 1.5px white ring so its navy half doesn't melt
// into the navy; the letter tile needs none. On a themed surface white would
// vanish in light mode and navy-800 in dark, so both variants get the 1px
// overlay border instead.
const ringClass = {
  "on-dark": { logo: "ring-[1.5px] ring-white", initial: "" },
  "on-light": {
    logo: "ring-1 ring-overlay-border",
    initial: "ring-1 ring-overlay-border",
  },
};

/**
 * The ministry's round tile: its logo when it has one, otherwise its initial.
 * Decorative (the names always sit beside it). Both variants are circles so
 * they line up.
 */
export const MinistryMark = ({
  ministry,
  size = 32,
  tone = "on-dark",
  className,
}: MinistryMarkProps) =>
  ministry.logoUrl ? (
    <Image
      alt=""
      className={clsx("shrink-0 rounded-full", ringClass[tone].logo, className)}
      height={size}
      src={ministry.logoUrl}
      style={{ width: size, height: size }}
      width={size}
    />
  ) : (
    <span
      aria-hidden="true"
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-gold-300",
        ringClass[tone].initial,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {ministry.initial}
    </span>
  );

// The card's surface, shared by the static label and the menu trigger.
const cardClass =
  "flex items-center gap-2.5 rounded-tile bg-white/6 py-2.5 pr-2.5 pl-3 text-left";

type CardLabelProps = {
  context: ChurchContext;
  /** A church switch is running: the church line dims until it lands. */
  isPending?: boolean;
};

/** Logo, ministry (muted, up to two lines) and church (bold, one line). */
const CardLabel = ({ context, isPending = false }: CardLabelProps) => {
  const { ministry, church } = context;

  return (
    <>
      <MinistryMark ministry={ministry} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className="line-clamp-2 text-xs leading-[1.3] font-medium text-muted-on-dark"
          title={ministry.name}
        >
          {ministry.name}
        </span>
        <span
          className={clsx(
            "truncate text-sm leading-[1.3] font-semibold text-white transition-opacity",
            isPending && "opacity-60",
          )}
          title={church.name}
        >
          {church.name}
        </span>
      </span>
    </>
  );
};

type ChurchContextCardProps = {
  context: ChurchContext;
  className?: string;
};

/**
 * Ministry › church card under the sidebar logo. Styled for the navy rail only
 * (same in light and dark).
 *
 * With one church it's a static label (not focusable). With more, the whole
 * card opens the church menu (docs/MINISTRY-CHURCH-CONTEXT.md, Stage 2).
 *
 * This is the hook for per-ministry/church branding: the tile already shows the
 * ministry's logo when `logoUrl` is set.
 */
export const ChurchContextCard = ({
  context,
  className,
}: ChurchContextCardProps) =>
  context.churches.length > 1 ? (
    <ChurchMenu className={className} context={context} />
  ) : (
    <div className={clsx(cardClass, className)}>
      <CardLabel context={context} />
    </div>
  );

// TODO: past ~8 churches, add a filter field above the list.
const ChurchMenu = ({ context, className }: ChurchContextCardProps) => {
  const { ministry, church, churches } = context;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const selectChurch = (churchId: string) => {
    // Picking the current church only closes the menu.
    if (churchId === church.id) return;

    startTransition(async () => {
      const result = await switchChurch(churchId);

      if (!result.ok) return;

      // The action's revalidatePath already re-renders this page for the new
      // church; only a detail page has to move (to its list).
      const next = pathAfterChurchSwitch(pathname);

      if (next !== pathname) router.push(next);
    });
  };

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        className={clsx(
          cardClass,
          // HeroUI shrinks a pressed trigger to 0.97, and react-aria keeps
          // it "pressed" while the menu is open, so the card would stay small.
          "hover:bg-white/10 aria-expanded:bg-white/10 data-pressed:transform-none",
          className,
        )}
      >
        <CardLabel context={context} isPending={isPending} />
        <ChevronUpDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-on-dark"
          strokeWidth={1.8}
        />
      </Dropdown.Trigger>
      <Dropdown.Popover
        className="w-72 max-w-[calc(100vw-2rem)] rounded-[14px] border border-overlay-border p-1.5 shadow-overlay-menu"
        offset={6}
        placement="bottom start"
      >
        <div className="flex items-center gap-2.5 px-2.5 pt-2.5 pb-2">
          <MinistryMark ministry={ministry} size={28} tone="on-light" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13.5px] font-semibold text-heading">
              {ministry.name}
            </span>
            <span className="text-[12.5px] text-muted">
              {churches.length} churches
            </span>
          </span>
        </div>
        <div className="mx-1 mt-0.5 mb-1 h-px bg-separator" />
        <Dropdown.Menu
          disallowEmptySelection
          aria-label={`Churches in ${ministry.name}`}
          className="p-0"
          selectedKeys={[church.id]}
          selectionMode="single"
          onSelectionChange={(keys) => {
            const [churchId] = keys === "all" ? [] : [...keys];

            if (typeof churchId === "string") selectChurch(churchId);
          }}
        >
          {churches.map((item) => (
            <Dropdown.Item
              key={item.id}
              // HeroUI's hover is bg-default, which equals the overlay
              // (navy-800) in dark mode, so the hover has its own tint.
              className="min-h-11 gap-2.5 rounded-[10px] px-3 text-sm font-medium text-foreground not-data-selected:hover:bg-surface-tertiary/60 data-selected:bg-surface-tertiary data-selected:font-semibold data-selected:text-heading"
              id={item.id}
              textValue={item.name}
            >
              {({ isSelected }) => (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {isSelected && (
                    <CheckIcon
                      aria-hidden="true"
                      className="size-[18px] shrink-0 text-accent"
                      strokeWidth={2}
                    />
                  )}
                </>
              )}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
};
