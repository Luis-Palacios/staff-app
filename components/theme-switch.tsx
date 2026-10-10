"use client";

import { FC, Key, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export interface ThemeSwitchProps {
  className?: string;
}

/** Shared with the account menu, which offers the same choices below `sm`. */
export const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: SunIcon },
  { key: "dark", label: "Dark", icon: MoonIcon },
  { key: "system", label: "System", icon: ComputerDesktopIcon },
] as const;

// HeroUI's ToggleButton reads its colors from --toggle-button-* variables, so
// we restyle it by setting those (to our --segment tokens) instead of fighting
// its selectors. Unselected = transparent on the track; selected = raised pill
// with a gold-filled icon (in both modes, so the active choice reads at a glance).
const segmentButton = clsx(
  "h-[30px] w-[34px] min-w-0 rounded-[7px] px-0",
  "[--toggle-button-bg:transparent] [--toggle-button-bg-hover:transparent] [--toggle-button-bg-pressed:transparent]",
  "[--toggle-button-fg:var(--muted)] hover:[--toggle-button-fg:var(--foreground)]",
  "[--toggle-button-bg-selected:var(--segment-selected)] [--toggle-button-bg-selected-hover:var(--segment-selected)] [--toggle-button-bg-selected-pressed:var(--segment-selected)]",
  "[--toggle-button-fg-selected:var(--segment-icon-selected)] data-[selected=true]:shadow-segment",
  "data-[selected=true]:[&_svg]:fill-warning",
);

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Same footprint as the real control (3 × 34px + gaps + padding + border),
  // so the topbar doesn't shift when it mounts.
  if (!isMounted) return <div aria-hidden className="h-[38px] w-[114px]" />;

  const handleSelectionChange = (keys: Set<Key>) => {
    const [next] = keys;

    if (typeof next === "string") setTheme(next);
  };

  return (
    <ToggleButtonGroup
      disallowEmptySelection
      aria-label="Theme"
      className={clsx(
        "gap-0.5 rounded-[10px] border border-border bg-segment p-[3px]",
        className,
      )}
      selectedKeys={[theme ?? "system"]}
      onSelectionChange={handleSelectionChange}
    >
      {THEME_OPTIONS.map(({ key, label, icon: Icon }) => (
        <ToggleButton
          key={key}
          isIconOnly
          aria-label={label}
          className={segmentButton}
          id={key}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
