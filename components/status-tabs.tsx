"use client";

import type { Key } from "react";

import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import clsx from "clsx";

// Same segmented-control treatment as ThemeSwitch: HeroUI's ToggleButton reads
// its colors from --toggle-button-* variables, set here to the --segment
// tokens. The selected label is heading-colored (not accent, as the theme
// switch's icons are) so the accent count pill carries the emphasis.
const segmentButton = clsx(
  "h-[34px] shrink-0 gap-2 rounded-[7px] px-3.5 text-sm font-semibold",
  "[--toggle-button-bg:transparent] [--toggle-button-bg-hover:transparent] [--toggle-button-bg-pressed:transparent]",
  "[--toggle-button-fg:var(--muted)] hover:[--toggle-button-fg:var(--foreground)]",
  "[--toggle-button-bg-selected:var(--segment-selected)] [--toggle-button-bg-selected-hover:var(--segment-selected)] [--toggle-button-bg-selected-pressed:var(--segment-selected)]",
  "[--toggle-button-fg-selected:var(--heading)] data-[selected=true]:shadow-segment",
  // The count pill: accent when its segment is selected, quiet otherwise.
  "[&_[data-count]]:bg-border [&_[data-count]]:text-foreground",
  "data-[selected=true]:[&_[data-count]]:bg-accent data-[selected=true]:[&_[data-count]]:text-accent-foreground",
);

// Status tabs with a count pill each (Applications, Groups). Labels are passed
// in already translated, so the caller owns its message namespace.
export function StatusTabs<TKey extends string>({
  ariaLabel,
  options,
  value,
  counts,
  highlighted,
  onChange,
}: {
  ariaLabel: string;
  options: readonly { key: TKey; label: string }[];
  value: TKey;
  counts: Record<TKey, number>;
  /** Tabs whose count is a call to action (gold, navy text) while above 0. */
  highlighted?: readonly TKey[];
  onChange: (value: TKey) => void;
}) {
  const handleSelectionChange = (keys: Set<Key>) => {
    const [next] = keys;

    if (typeof next === "string") onChange(next as TKey);
  };

  return (
    <ToggleButtonGroup
      disallowEmptySelection
      aria-label={ariaLabel}
      className="max-w-full justify-start gap-0.5 overflow-x-auto rounded-[10px] border border-border bg-segment p-[3px]"
      selectedKeys={[value]}
      onSelectionChange={handleSelectionChange}
    >
      {options.map(({ key, label }) => (
        <ToggleButton key={key} className={segmentButton} id={key}>
          {label}
          <span
            data-count
            className="rounded-full px-[7px] py-px text-xs font-semibold tabular-nums data-[highlight=true]:bg-gold-500! data-[highlight=true]:text-navy-900!"
            data-highlight={highlighted?.includes(key) && counts[key] > 0}
          >
            {counts[key]}
          </span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
