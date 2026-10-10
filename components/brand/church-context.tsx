import type { ChurchContext, Ministry } from "@/config/site";

import Image from "next/image";
import clsx from "clsx";

type MinistryMarkProps = {
  ministry: Ministry;
  /** Diameter in px. */
  size?: number;
  className?: string;
};

/**
 * The ministry's round tile: its logo when it has one, otherwise its initial.
 * Decorative (the names always sit beside it). Both variants are circles so
 * they line up. The logo's white ring keeps its navy half off the navy rail.
 */
export const MinistryMark = ({
  ministry,
  size = 32,
  className,
}: MinistryMarkProps) =>
  ministry.logoUrl ? (
    <Image
      alt=""
      className={clsx(
        "shrink-0 rounded-full ring-[1.5px] ring-white",
        className,
      )}
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
        className,
      )}
      style={{ width: size, height: size }}
    >
      {ministry.initial}
    </span>
  );

type ChurchContextCardProps = {
  context: ChurchContext;
  className?: string;
};

/**
 * Ministry › church card under the sidebar logo: the ministry's tile, its name
 * (muted, up to two lines) and the current church (bold, one line). Styled for
 * the navy rail only (same in light and dark).
 *
 * This is the hook for per-ministry/church branding: the tile already shows the
 * ministry's logo when `logoUrl` is set. Static for now; it becomes the church
 * switcher when there is more than one church (docs/MINISTRY-CHURCH-CONTEXT.md).
 */
export const ChurchContextCard = ({
  context,
  className,
}: ChurchContextCardProps) => {
  const { ministry, church } = context;

  return (
    <div
      className={clsx(
        "flex items-center gap-2.5 rounded-tile bg-white/6 py-2.5 pr-2.5 pl-3",
        className,
      )}
    >
      <MinistryMark ministry={ministry} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className="line-clamp-2 text-xs leading-[1.3] font-medium text-muted-on-dark"
          title={ministry.name}
        >
          {ministry.name}
        </span>
        <span
          className="truncate text-sm leading-[1.3] font-semibold text-white"
          title={church.name}
        >
          {church.name}
        </span>
      </span>
    </div>
  );
};
