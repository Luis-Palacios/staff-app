"use client";

import { FC, Key, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";

import { SunFilledIcon, MoonFilledIcon, SystemIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

const THEME_OPTIONS = [
  { key: "light", label: "Light", icon: SunFilledIcon },
  { key: "dark", label: "Dark", icon: MoonFilledIcon },
  { key: "system", label: "System", icon: SystemIcon },
] as const;

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div aria-hidden className="h-8 w-[104px]" />;

  const handleSelectionChange = (keys: Set<Key>) => {
    const [next] = keys;

    if (typeof next === "string") setTheme(next);
  };

  return (
    <ToggleButtonGroup
      disallowEmptySelection
      aria-label="Theme"
      className={className}
      selectedKeys={[theme ?? "system"]}
      size="sm"
      onSelectionChange={handleSelectionChange}
    >
      {THEME_OPTIONS.map(({ key, label, icon: Icon }) => (
        <ToggleButton key={key} isIconOnly aria-label={label} id={key}>
          <Icon size={16} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
