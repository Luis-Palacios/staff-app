import type { ComponentType, SVGProps } from "react";

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

async function StatValue({ value }: { value: Promise<number> }) {
  return <>{await value}</>;
}

// Dashboard stat: icon tile, display-font number, label and muted sub-label,
// the whole tile linking to the list behind it. Only the number waits on the
// fetch, inside its own Suspense, so the tile's frame and labels show at once
// and a slow service holds up just its own number.
export function StatTile({
  icon: Icon,
  tone,
  value,
  label,
  sub,
  href,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "accent" | "warning";
  value: Promise<number>;
  label: string;
  sub: string;
  href: string;
}) {
  // card()'s shadow utilities outrank the global focus halo (a base-layer
  // rule), so the halo is restated here; the dark: copy beats dark:shadow-none.
  return (
    <NextLink
      className={card({
        className: [
          "flex flex-col gap-2.5 p-5 transition-colors hover:border-field-border",
          "focus-visible:shadow-[var(--shadow-focus)] dark:focus-visible:shadow-[var(--shadow-focus)]",
        ],
      })}
      href={href}
    >
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
      <div className="font-display text-[40px] font-medium leading-none text-heading tabular-nums">
        <Suspense fallback={<Skeleton className="h-10 w-14 rounded-lg" />}>
          <StatValue value={value} />
        </Suspense>
      </div>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-heading">{label}</span>
        <span className="text-[13px] text-muted">{sub}</span>
      </span>
    </NextLink>
  );
}
