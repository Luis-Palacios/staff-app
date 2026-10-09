"use client";

import { useEffect, useRef, useState } from "react";
import { Dropdown, InputGroup, Kbd, TextField } from "@heroui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { ThemeSwitch } from "@/components/theme-switch";
import { EkklesiaioMark } from "@/components/brand/ekklesiaio-logo";
import { MenuIcon } from "@/components/icons";
import { useCurrentUser } from "@/lib/contexts/user-context";
import { authClient } from "@/lib/auth/auth-client";
import { ROLE_LABELS } from "@/lib/auth/roles";

interface TopbarProps {
  onMenuClick: () => void;
}

function getInitials(name: string): string {
  const [first, last] = name.trim().split(/\s+/);

  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

/**
 * macOS users expect ⌘ in shortcut hints; everyone else gets "Ctrl".
 * Starts false so the server render and first client render match, then
 * corrects itself after mount.
 */
function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string };
    };
    const platform = nav.userAgentData?.platform ?? nav.platform;

    setIsMac(/mac/i.test(platform));
  }, []);

  return isMac;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const isMac = useIsMac();
  // Below `sm` the search field is collapsed behind an icon button.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center gap-3 border-b border-border bg-background/88 px-4 py-3.5 backdrop-blur lg:px-8">
      <button
        aria-label="Open menu"
        className="rounded-lg p-1 text-muted hover:bg-surface-secondary lg:hidden"
        onClick={onMenuClick}
      >
        <MenuIcon size={22} />
      </button>

      <NextLink
        aria-label="ekklesiaio home"
        className="flex items-center lg:hidden"
        href="/"
      >
        <EkklesiaioMark size={32} tone="auto" />
      </NextLink>

      <TextField
        aria-label="Search"
        className={clsx(
          "max-w-[520px] flex-1",
          // Mobile: hidden until the search button opens it on its own row.
          isSearchOpen
            ? "order-last basis-full sm:order-none sm:basis-auto"
            : "hidden sm:flex",
        )}
        type="search"
      >
        <InputGroup className="h-[42px] w-full">
          <InputGroup.Prefix className="border-0 pr-2.5 pl-3">
            <MagnifyingGlassIcon
              className="pointer-events-none size-[18px] shrink-0 text-muted"
              strokeWidth={1.8}
            />
          </InputGroup.Prefix>
          <InputGroup.Input
            ref={searchInputRef}
            className="text-sm"
            placeholder="Search people, applications…"
          />
          <InputGroup.Suffix className="border-0 pr-2 pl-2">
            <Kbd className="hidden h-auto rounded-md border border-border px-[7px] py-0.5 text-xs font-semibold [word-spacing:normal] lg:inline-flex">
              {isMac ? (
                <Kbd.Abbr keyValue="command" />
              ) : (
                <Kbd.Content>Ctrl</Kbd.Content>
              )}
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>

      <div className="ml-auto flex items-center gap-3">
        <button
          aria-expanded={isSearchOpen}
          aria-label="Search"
          className="rounded-lg p-2 text-muted hover:bg-surface-secondary sm:hidden"
          onClick={() => setIsSearchOpen((open) => !open)}
        >
          <MagnifyingGlassIcon className="size-5" strokeWidth={1.8} />
        </button>
        <ThemeSwitch />
        <Dropdown.Root>
          <Dropdown.Trigger
            aria-label={`Account menu, ${currentUser.name}`}
            className="flex h-[42px] items-center gap-2.5 rounded-full pr-1 pl-1 hover:bg-surface-secondary md:pr-2.5"
          >
            {/* Navy/gold in light, gold/navy in dark: --accent-foreground is
                white in light mode, so this needs an explicit dark: swap. */}
            <span
              aria-hidden="true"
              className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-navy-900 text-[13px] font-bold text-gold-500 dark:bg-gold-500 dark:text-navy-900"
            >
              {getInitials(currentUser.name)}
            </span>
            <span className="hidden flex-col items-start leading-tight md:flex">
              <span className="text-sm font-semibold text-heading">
                {currentUser.name}
              </span>
              <span className="text-xs text-muted">
                {ROLE_LABELS[currentUser.role] ?? currentUser.role}
              </span>
            </span>
            <ChevronDownIcon
              className="hidden size-3.5 text-muted md:block"
              strokeWidth={2}
            />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end">
            <div className="border-b border-separator px-3 py-2">
              <p className="text-xs text-muted">Signed in as</p>
              <p className="truncate text-sm font-medium">
                {currentUser.email}
              </p>
            </div>
            <Dropdown.Menu aria-label="Account">
              <Dropdown.Item onAction={() => router.push("/users/me")}>
                My Profile
              </Dropdown.Item>
              <Dropdown.Item variant="danger" onAction={handleSignOut}>
                <span data-slot="label">Logout</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </div>
    </header>
  );
};
