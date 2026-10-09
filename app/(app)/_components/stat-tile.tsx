import type { ComponentType, ReactNode, SVGProps } from "react";
import type { Settled } from "@/lib/settle";

import { Suspense } from "react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@heroui/react/skeleton";
import NextLink from "next/link";
import { tv } from "tailwind-variants";

import { card } from "@/components/primitives";

export const iconTile = tv({
  base: "flex size-9 shrink-0 items-center justify-center rounded-control",
  variants: {
    tone: {
      accent: "bg-accent-soft text-accent-soft-foreground",
      warning: "bg-warning-soft text-warning-soft-foreground",
    },
  },
  defaultVariants: {
    tone: "accent",
  },
});

type StatTileProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  // A count that means "someone should act", shown in the warning tone while
  // it's above zero. Otherwise, and while loading or failed, the tile is accent.
  attention?: boolean;
  value: Promise<Settled<number>>;
  label: string;
  sub: string;
  href: string;
};

// The tile's layout, shared by the loaded tile and its loading fallback.
function StatTileFrame({
  icon: Icon,
  tone,
  number,
  label,
  sub,
}: Pick<StatTileProps, "icon" | "label" | "sub"> & {
  tone: "accent" | "warning";
  number: ReactNode;
}) {
  return (
    <>
      <span className="flex items-center justify-between">
        <span className={iconTile({ tone })}>
          <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.7} />
        </span>
        <ArrowRightIcon
          aria-hidden="true"
          className="size-4 text-subtle"
          strokeWidth={1.8}
        />
      </span>
      {/* A div, not a span: the Skeleton fallback renders a div. */}
      <div className="font-display text-[32px] font-medium leading-none text-heading tabular-nums sm:text-[40px]">
        {number}
      </div>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-heading">{label}</span>
        <span className="text-[13px] text-muted">{sub}</span>
      </span>
    </>
  );
}

async function LoadedStatTile({
  value,
  attention,
  sub,
  ...frame
}: Omit<StatTileProps, "href">) {
  const result = await value;

  if (!result.ok) {
    return (
      <StatTileFrame {...frame} number="—" sub="Couldn't load" tone="accent" />
    );
  }

  return (
    <StatTileFrame
      {...frame}
      number={result.value}
      sub={sub}
      tone={attention && result.value > 0 ? "warning" : "accent"}
    />
  );
}

// Dashboard stat: icon tile, display-font number, label and muted sub-label,
// the whole tile linking to the list behind it. The link and labels show at
// once; the body suspends on its own fetch, so a slow or failing service only
// affects its own tile ("—" + "Couldn't load" on failure).
export function StatTile({ href, ...props }: StatTileProps) {
  // card()'s shadow utilities outrank the global focus halo (a base-layer
  // rule), so the halo is restated here; the dark: copy beats dark:shadow-none.
  return (
    <NextLink
      className={card({
        className: [
          "flex flex-col gap-2.5 p-4 transition-colors hover:border-field-border sm:p-5",
          "focus-visible:shadow-[var(--shadow-focus)] dark:focus-visible:shadow-[var(--shadow-focus)]",
        ],
      })}
      href={href}
    >
      <Suspense
        fallback={
          <StatTileFrame
            icon={props.icon}
            label={props.label}
            number={<Skeleton className="h-8 w-14 rounded-lg sm:h-10" />}
            sub={props.sub}
            tone="accent"
          />
        }
      >
        <LoadedStatTile {...props} />
      </Suspense>
    </NextLink>
  );
}
