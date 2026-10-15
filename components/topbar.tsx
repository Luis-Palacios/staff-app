"use client";

import type { ChurchContext } from "@/config/site";
import type { Locale } from "@/lib/locale-shared";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Dropdown,
  Header,
  InputGroup,
  Kbd,
  TextField,
  useMediaQuery,
} from "@heroui/react";
import {
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { tv } from "tailwind-variants";

import { THEME_OPTIONS, ThemeSwitch } from "@/components/theme-switch";
import { EkklesiaioMark } from "@/components/brand/ekklesiaio-logo";
import { MenuIcon } from "@/components/icons";
import { InitialsAvatar, initialsOf } from "@/components/initials-avatar";
import { StatusBadge } from "@/components/status-badge";
import { useCurrentUser } from "@/lib/contexts/user-context";
import { authClient } from "@/lib/auth/auth-client";
import { isLocale, LOCALE_LABELS, LOCALES } from "@/lib/locale-shared";
import { setLocale } from "@/app/(app)/_actions/set-locale";

interface TopbarProps {
  context: ChurchContext;
  /** Resolved on the server (lib/locale.ts); never read from the cookie here. */
  locale: Locale;
  onMenuClick: () => void;
}

// Navy/gold in light, gold/navy in dark: --accent-foreground is white in
// light mode, so the avatars need an explicit dark: swap. Shared by the
// trigger and the menu header so the two always match.
const accountAvatarColors =
  "bg-navy-900 text-gold-500 dark:bg-gold-500 dark:text-navy-900";

// Account menu groups and rows. HeroUI's .menu-item only tints on hover
// (bg-default) and just rings keyboard focus, so arrowing through the menu
// shows no row highlight. We set both states via react-aria's data-hovered /
// data-focused attributes, which also lets Sign out swap in bg-danger-soft.
// tv (not clsx) so the danger colors replace the defaults: with both classes
// on the element, Tailwind's stylesheet order would pick the winner.
const menuGroup = "w-full gap-0.5 border-t border-separator p-1.5";
const menuItem = tv({
  slots: {
    base: "h-10 min-h-0 gap-2.5 rounded-[10px] px-2.5 py-0 text-sm font-medium text-heading data-focused:bg-surface-secondary data-hovered:bg-surface-secondary",
    icon: "size-[18px] shrink-0 text-muted",
  },
  variants: {
    danger: {
      true: {
        base: "text-danger data-focused:bg-danger-soft data-hovered:bg-danger-soft",
        icon: "text-danger",
      },
    },
  },
});
// Pass the variant per slot call (`item({ danger: true })`): slot functions
// from separate menuItem() calls share state, so a second, danger-variant
// menuItem() call would turn every row red.
const { base: item, icon: itemIcon } = menuItem();

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

export const Topbar = ({ context, locale, onMenuClick }: TopbarProps) => {
  const { ministry, church } = context;
  const t = useTranslations("AccountMenu");
  const tTopbar = useTranslations("Topbar");
  const tRoles = useTranslations("Roles");
  const tTheme = useTranslations("ThemeSwitch");
  const router = useRouter();
  const currentUser = useCurrentUser();
  const isMac = useIsMac();
  const { theme, setTheme } = useTheme();
  // The check moves as soon as a language is picked. When the transition
  // ends, useOptimistic falls back to the `locale` prop: the new one after
  // setLocale's revalidation, or the old one if the action refused (a revert).
  const [optimisticLocale, setOptimisticLocale] = useOptimistic(locale);
  const [, startLocaleTransition] = useTransition();
  // Tailwind's `sm` (40rem). Below it the segmented theme switch is hidden to
  // make room for the church label, and its options move into the account
  // menu. A media query rather than `sm:hidden`: hidden items would still be
  // in the menu's keyboard order.
  const isSmUp = useMediaQuery("(min-width: 40rem)");
  // Below `sm` the search field is collapsed behind an icon button.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // AuthRole mirrors auth-server by hand, so a role added there first would
  // have no label yet: show its raw value rather than "Roles.<role>".
  const roleLabel = tRoles.has(currentUser.role)
    ? tRoles(currentUser.role)
    : currentUser.role;

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  // Ctrl/⌘ K focuses the search field (opening it first below `sm`).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key?.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey))
        return;

      event.preventDefault();
      setIsSearchOpen(true);
      searchInputRef.current?.focus();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function selectLocale(next: Locale) {
    if (next === locale) return;

    startLocaleTransition(async () => {
      setOptimisticLocale(next);
      await setLocale(next);
    });
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    // Below lg: tighter gaps and padding (OptionB-Phone) so the church label
    // fits at 390px; the 44px buttons carry their own padding on the left.
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b border-border bg-background/88 py-2.5 pr-4 pl-2 backdrop-blur lg:min-h-[72px] lg:gap-3 lg:px-8 lg:py-3.5">
      <button
        aria-label={tTopbar("openMenu")}
        className="flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary lg:hidden"
        onClick={onMenuClick}
      >
        <MenuIcon size={22} />
      </button>

      <NextLink
        aria-label={tTopbar("home")}
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
        aria-label={tTopbar("search")}
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
            placeholder={tTopbar("searchPlaceholder")}
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
          aria-label={tTopbar("search")}
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
            aria-label={t("trigger", { name: currentUser.name })}
            // Open: keeps the hover tint and the chevron flips up. HeroUI
            // scales a pressed trigger to 0.97 and react-aria keeps it
            // "pressed" while the menu is open, so cancel that (as the
            // church menu does).
            className="group flex h-[42px] items-center gap-2.5 rounded-full pr-1 pl-1 hover:bg-surface-secondary aria-expanded:bg-surface-secondary data-pressed:transform-none md:pr-2.5"
          >
            <span
              aria-hidden="true"
              className={clsx(
                "flex size-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                accountAvatarColors,
              )}
            >
              {initialsOf(currentUser.name)}
            </span>
            <span className="hidden flex-col items-start leading-tight md:flex">
              <span className="text-sm font-semibold text-heading">
                {currentUser.name}
              </span>
              <span className="text-xs text-muted">{roleLabel}</span>
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className="hidden size-3.5 text-muted transition-transform group-aria-expanded:rotate-180 md:block"
              strokeWidth={2}
            />
          </Dropdown.Trigger>
          {/* Same frame as the church menu (w-72, 14px, overlay border and
              shadow), but on bg-surface: the default bg-overlay is navy-800
              in dark mode. No padding here; each group pads itself. */}
          <Dropdown.Popover
            className="w-72 max-w-[calc(100vw-2rem)] rounded-[14px] border border-overlay-border bg-surface p-0 shadow-overlay-menu"
            offset={8}
            placement="bottom end"
          >
            {/* Not a menu item, so it sits outside Dropdown.Menu. */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3.5">
              <InitialsAvatar
                className={accountAvatarColors}
                name={currentUser.name}
                size="lg"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[14.5px] font-semibold text-heading">
                    {currentUser.name}
                  </span>
                  {/* White text in dark mode (not --accent-soft-foreground's gold):
                      the menu already has gold avatar, check and theme icon,
                      and the role is a label, not an accent. */}
                  <StatusBadge
                    className="shrink-0 text-[11.5px] dark:text-heading"
                    tone="accent"
                  >
                    {roleLabel}
                  </StatusBadge>
                </div>
                <span
                  className="truncate text-[13px] text-muted"
                  title={currentUser.email}
                >
                  {currentUser.email}
                </span>
              </div>
            </div>
            {/* No padding or gap on the menu itself: each group carries
                its own top border and padding. */}
            <Dropdown.Menu aria-label={t("menu")} className="gap-0 p-0">
              {!isSmUp && (
                <Dropdown.Section
                  disallowEmptySelection
                  className={menuGroup}
                  selectedKeys={[theme ?? "system"]}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const [next] = keys === "all" ? [] : [...keys];

                    if (typeof next === "string") setTheme(next);
                  }}
                >
                  <Header className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted">
                    {tTheme("label")}
                  </Header>
                  {THEME_OPTIONS.map(({ key, icon: Icon }) => (
                    <Dropdown.Item
                      key={key}
                      className={item()}
                      id={key}
                      textValue={tTheme(key)}
                    >
                      {({ isSelected }) => (
                        <>
                          <Icon
                            aria-hidden="true"
                            className={itemIcon()}
                            strokeWidth={1.8}
                          />
                          <span className="flex-1">{tTheme(key)}</span>
                          {isSelected && (
                            <CheckIcon
                              aria-hidden="true"
                              className="size-4 shrink-0 text-accent"
                              strokeWidth={2.2}
                            />
                          )}
                        </>
                      )}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Section>
              )}
              <Dropdown.Section
                disallowEmptySelection
                className={menuGroup}
                selectedKeys={[optimisticLocale]}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const [next] = keys === "all" ? [] : [...keys];

                  if (isLocale(next)) selectLocale(next);
                }}
              >
                {/* self-stretch: .menu-section aligns its children to the
                    start, so the row would otherwise hug its text. */}
                <Header className="flex items-baseline justify-between gap-2 self-stretch px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted">
                  <span>{t("language")}</span>
                  <span className="font-normal">{t("languageDefault")}</span>
                </Header>
                {LOCALES.map((key) => {
                  const { label, tag } = LOCALE_LABELS[key];

                  return (
                    <Dropdown.Item
                      key={key}
                      className={item()}
                      id={key}
                      textValue={label}
                    >
                      {({ isSelected }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className="flex h-[18px] w-6 shrink-0 items-center justify-center rounded-[5px] border border-overlay-border text-[10px] font-bold tracking-[0.04em] text-muted"
                          >
                            {tag}
                          </span>
                          {/* Each name in its own language, so screen
                              readers pronounce "Español" in Spanish. */}
                          <span className="flex-1" lang={key}>
                            {label}
                          </span>
                          {isSelected && (
                            <CheckIcon
                              aria-hidden="true"
                              className="size-4 shrink-0 text-accent"
                              strokeWidth={2.2}
                            />
                          )}
                        </>
                      )}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Section>
              <Dropdown.Section
                aria-label={t("profileSection")}
                className={menuGroup}
              >
                <Dropdown.Item
                  className={item()}
                  textValue={t("myProfile")}
                  onAction={() => router.push("/users/me")}
                >
                  <UserCircleIcon
                    aria-hidden="true"
                    className={itemIcon()}
                    strokeWidth={1.8}
                  />
                  <span className="flex-1">{t("myProfile")}</span>
                </Dropdown.Item>
              </Dropdown.Section>
              <Dropdown.Section
                aria-label={t("sessionSection")}
                className={menuGroup}
              >
                <Dropdown.Item
                  className={item({ danger: true })}
                  textValue={t("signOut")}
                  variant="danger"
                  onAction={handleSignOut}
                >
                  <ArrowRightStartOnRectangleIcon
                    aria-hidden="true"
                    className={itemIcon({ danger: true })}
                    strokeWidth={1.8}
                  />
                  <span className="flex-1">{t("signOut")}</span>
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown.Root>
      </div>
    </header>
  );
};
