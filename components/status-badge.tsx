import type { ReactNode } from "react";

import { tv, type VariantProps } from "tailwind-variants";

// Status pill: a dot plus a word, so the state never relies on color alone.
// A solid dot means done or active; a hollow ring means pending or waiting.
// Colors come from the *-soft token pairs in globals.css, which are set
// explicitly per mode because HeroUI's derived ones fail contrast.
const statusBadge = tv({
  slots: {
    base: "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pl-2 pr-2.5 text-[12.5px] font-semibold",
    dot: "size-[7px] shrink-0 rounded-full border-[1.5px] border-current",
  },
  variants: {
    tone: {
      success: { base: "bg-success-soft text-success-soft-foreground" },
      warning: { base: "bg-warning-soft text-warning-soft-foreground" },
      danger: { base: "bg-danger-soft text-danger-soft-foreground" },
      neutral: { base: "bg-default text-muted" },
      accent: { base: "bg-accent-soft text-accent-soft-foreground" },
    },
    variant: {
      "solid-dot": { dot: "bg-current" },
      "ring-dot": { dot: "bg-transparent" },
    },
  },
  defaultVariants: {
    tone: "neutral",
    variant: "solid-dot",
  },
});

export type StatusBadgeProps = VariantProps<typeof statusBadge> & {
  children: ReactNode;
  className?: string;
};

export function StatusBadge({
  tone,
  variant,
  className,
  children,
}: StatusBadgeProps) {
  const { base, dot } = statusBadge({ tone, variant });

  return (
    <span className={base({ className })}>
      <span aria-hidden="true" className={dot()} />
      {children}
    </span>
  );
}
