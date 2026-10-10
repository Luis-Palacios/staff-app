"use client";

import type { ChurchContext } from "@/config/site";

import { useEffect, useRef, useState } from "react";
import {
  Dropdown,
  Header,
  InputGroup,
  Kbd,
  TextField,
  useMediaQuery,
} from "@heroui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { THEME_OPTIONS, ThemeSwitch } from "@/components/theme-switch";
import { EkklesiaioMark } from "@/components/brand/ekklesiaio-logo";
import { MenuIcon } from "@/components/icons";
import { useCurrentUser } from "@/lib/contexts/user-context";
import { authClient } from "@/lib/auth/auth-client";
import { ROLE_LABELS } from "@/lib/auth/roles";

interface TopbarProps {
  context: ChurchContext;
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

export const Topbar = ({ context, onMenuClick }: TopbarProps) => {
  const { ministry, church } = context;
  const router = useRouter();
  const currentUser = useCurrentUser();
  const isMac = useIsMac();
  const { theme, setTheme } = useTheme();
  // Tailwind's `sm` (40rem). Below it the segmented theme switch is hidden to
  // make room for the church label, and its options move into the account
  // menu. A media query rather than `sm:hidden`: hidden items would still be
  // in the menu's keyboard order.
  const isSmUp = useMediaQuery("(min-width: 40rem)");
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
    // Below lg: tighter gaps and padding (OptionB-Phone) so the church label
    // fits at 390px; the 44px buttons carry their own padding on the left.
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b border-border bg-background/88 py-2.5 pr-4 pl-2 backdrop-blur lg:min-h-[72px] lg:gap-3 lg:px-8 lg:py-3.5">
      <button
        aria-label="Open menu"
        className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary lg:hidden"
        onClick={onMenuClick}
      >
        <MenuIcon size={22} />
      </button>

      <NextLink
        aria-label="ekklesiaio home"
        className="flex items-center lg:hidden"
        href="/"
      >
        <EkklesiaioMark size={26} tone="auto" />
      </NextLink>

      {/* Below lg the sidebar (and its church card) is off-canvas, so the
          topbar says where you are. Text only: switching stays in the card,
          one tap away behind the hamburger. From sm the search field is the
          one that grows, so the label only takes its text's width. */}
      <div className="ml-1 flex min-w-0 flex-1 flex-col sm:flex-initial border-l border-border pl-2.5 lg:hidden">
        <span
          className="truncate text-[11.5px] leading-[1.3] text-muted"
          title={ministry.name}
        >
          {ministry.name}
        </span>
        <span
          className="truncate text-[14.5px] leading-[1.3] font-semibold text-heading"
          title={church.name}
        >
          {church.name}
        </span>
      </div>

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

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <button
          aria-expanded={isSearchOpen}
          aria-label="Search"
          className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary sm:hidden"
          onClick={() => setIsSearchOpen((open) => !open)}
        >
          <MagnifyingGlassIcon className="size-5" strokeWidth={1.8} />
        </button>
        <div className="hidden sm:block">
          <ThemeSwitch />
        </div>
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
              {!isSmUp && (
                <Dropdown.Section
                  disallowEmptySelection
                  className="border-b border-separator pb-1"
                  selectedKeys={[theme ?? "system"]}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const [next] = keys === "all" ? [] : [...keys];

                    if (typeof next === "string") setTheme(next);
                  }}
                >
                  <Header className="px-3 pt-1 pb-0.5 text-xs text-muted">
                    Theme
                  </Header>
                  {THEME_OPTIONS.map(({ key, label, icon: Icon }) => (
                    <Dropdown.Item key={key} id={key} textValue={label}>
                      {({ isSelected }) => (
                        <>
                          <Icon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted"
                            strokeWidth={1.8}
                          />
                          <span className="flex-1">{label}</span>
                          {isSelected && (
                            <CheckIcon
                              aria-hidden="true"
                              className="size-4 shrink-0 text-accent"
                              strokeWidth={2}
                            />
                          )}
                        </>
                      )}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Section>
              )}
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
