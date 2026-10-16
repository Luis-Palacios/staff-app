"use client";

import type { ComponentType, SVGProps } from "react";

import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

/**
 * A Yes / No pair for one question. Two `aria-pressed` buttons, so nothing is chosen until the
 * leader picks (rule 3). `large` is the person step's 56px; the list uses the 44px compact pair.
 * Selected Yes is a success fill and No a neutral one, each with its own icon, so the answer
 * never rests on colour alone.
 */
export function YesNoButtons({
  value,
  onChange,
  yesLabel,
  noLabel,
  label,
  size,
  describedBy,
  NoIcon = XMarkIcon,
}: {
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
  /** The question, as the group's accessible name. */
  label: string;
  size: "large" | "compact";
  describedBy?: string;
  /** The No button's glyph; an X unless the answer is a different kind of "no". */
  NoIcon?: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  const large = size === "large";
  const base = clsx(
    "flex items-center justify-center gap-1.5 rounded-control border font-semibold outline-none transition-colors",
    "focus-visible:shadow-[var(--shadow-focus)]",
    large ? "h-14 text-[15px]" : "h-11 min-w-[68px] px-3 text-sm",
  );
  const idle =
    "border-field-border bg-field-background text-foreground hover:border-accent";
  const icon = large ? "size-5" : "size-4";

  return (
    <div
      aria-describedby={describedBy}
      aria-label={label}
      className={clsx("grid grid-cols-2", large ? "gap-3" : "gap-1.5")}
      role="group"
    >
      <button
        aria-pressed={value === true}
        className={clsx(
          base,
          value === true
            ? "border-success-soft-foreground bg-success-soft text-success-soft-foreground"
            : idle,
        )}
        type="button"
        onClick={() => onChange(true)}
      >
        <CheckIcon aria-hidden="true" className={icon} strokeWidth={2.2} />
        {yesLabel}
      </button>
      <button
        aria-pressed={value === false}
        className={clsx(
          base,
          value === false ? "border-muted bg-default text-foreground" : idle,
        )}
        type="button"
        onClick={() => onChange(false)}
      >
        <NoIcon aria-hidden="true" className={icon} strokeWidth={2.2} />
        {noLabel}
      </button>
    </div>
  );
}
