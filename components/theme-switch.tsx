"use client";

import { ComponentProps, FC, Key, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export interface ThemeSwitchProps {
  className?: string;
}

/**
 * Heroicons' outline ComputerDesktopIcon is a single path, so filling it (the
 * selected state below) also floods the chin and stand and swallows the
 * screen's bottom edge — in dark mode the gold stroke and fill match, so the
 * line vanishes. Same outline, but with a screen-only fill layer underneath:
 * the rect inherits the svg's fill, the outline path never fills.
 */
const SystemIcon: FC<ComponentProps<"svg">> = (props) => (
  <svg
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
    {...props}
  >
    <rect
      fill="inherit"
      height="11.25"
      rx="2.25"
      stroke="none"
      width="18"
      x="3"
      y="3"
    />
    <path
      d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Shared with the account menu, which offers the same choices below `sm`. */
export const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: SunIcon },
  { key: "dark", label: "Dark", icon: MoonIcon },
  { key: "system", label: "System", icon: SystemIcon },
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
