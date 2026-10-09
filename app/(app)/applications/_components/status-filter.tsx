"use client";

import type { Key } from "react";

import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import clsx from "clsx";

export type ApplicationStatusFilter = "all" | "pending" | "fulfilled";

export const STATUS_FILTERS: {
  key: ApplicationStatusFilter;
  label: string;
}[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "fulfilled", label: "Fulfilled" },
];

// Same segmented-control treatment as ThemeSwitch: HeroUI's ToggleButton reads
// its colors from --toggle-button-* variables, set here to the --segment
// tokens. The selected label is heading-colored (not accent, as the theme
// switch's icons are) so the accent count pill carries the emphasis.
const segmentButton = clsx(
  "h-[34px] gap-2 rounded-[7px] px-3.5 text-sm font-semibold",
  "[--toggle-button-bg:transparent] [--toggle-button-bg-hover:transparent] [--toggle-button-bg-pressed:transparent]",
  "[--toggle-button-fg:var(--muted)] hover:[--toggle-button-fg:var(--foreground)]",
  "[--toggle-button-bg-selected:var(--segment-selected)] [--toggle-button-bg-selected-hover:var(--segment-selected)] [--toggle-button-bg-selected-pressed:var(--segment-selected)]",
  "[--toggle-button-fg-selected:var(--heading)] data-[selected=true]:shadow-segment",
  // The count pill: accent when its segment is selected, quiet otherwise.
  "[&_[data-count]]:bg-border [&_[data-count]]:text-foreground",
  "data-[selected=true]:[&_[data-count]]:bg-accent data-[selected=true]:[&_[data-count]]:text-accent-foreground",
);

export function StatusFilter({
  value,
  counts,
  onChange,
}: {
  value: ApplicationStatusFilter;
  counts: Record<ApplicationStatusFilter, number>;
  onChange: (value: ApplicationStatusFilter) => void;
}) {
  const handleSelectionChange = (keys: Set<Key>) => {
    const [next] = keys;

    if (typeof next === "string") onChange(next as ApplicationStatusFilter);
  };

  return (
    <ToggleButtonGroup
      disallowEmptySelection
      aria-label="Filter by status"
      className="gap-0.5 rounded-[10px] border border-border bg-segment p-[3px]"
      selectedKeys={[value]}
      onSelectionChange={handleSelectionChange}
    >
      {STATUS_FILTERS.map(({ key, label }) => (
        <ToggleButton key={key} className={segmentButton} id={key}>
          {label}
          <span
            data-count
            className="rounded-full px-[7px] py-px text-xs font-semibold tabular-nums"
          >
            {counts[key]}
          </span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
