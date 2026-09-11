"use client";

import { Avatar, InputGroup, Kbd, TextField } from "@heroui/react";
import NextLink from "next/link";

import { ThemeSwitch } from "@/components/theme-switch";
import { MenuIcon, SearchIcon, Logo } from "@/components/icons";

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-auto items-center gap-3 border-b border-separator bg-background/70 px-4 backdrop-blur-lg">
      <button
        aria-label="Open menu"
        className="rounded-lg p-1 text-muted hover:bg-surface-secondary lg:hidden"
        onClick={onMenuClick}
      >
        <MenuIcon size={22} />
      </button>

      <NextLink className="flex items-center lg:hidden" href="/">
        <Logo size={42} />
      </NextLink>

      <TextField aria-label="Search" className="flex-1" type="search">
        <InputGroup>
          <InputGroup.Prefix>
            <SearchIcon className="text-base text-muted pointer-events-none flex-shrink-0" />
          </InputGroup.Prefix>
          <InputGroup.Input className="text-sm" placeholder="Search..." />
          <InputGroup.Suffix>
            <Kbd className="hidden lg:inline-flex">
              <Kbd.Abbr keyValue="command" />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>

      <div className="ml-auto flex items-center gap-2">
        <ThemeSwitch />
        <Avatar className="size-8 shrink-0" size="sm">
          <Avatar.Fallback>SA</Avatar.Fallback>
        </Avatar>
      </div>
    </header>
  );
};
