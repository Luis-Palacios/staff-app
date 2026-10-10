"use client";

import type {
  ChurchContext,
  HeroIcon,
  NavIconName,
  NavItem,
} from "@/config/site";

import { Disclosure } from "@heroui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import { CloseIcon } from "@/components/icons";
import { EkklesiaioLogo } from "@/components/brand/ekklesiaio-logo";
import { ChurchContextCard } from "@/components/brand/church-context";
import { siteConfig } from "@/config/site";

// Heroicons outline (24px grid), drawn at stroke 1.6 by `NavIcon` below.
const iconRegistry: Record<NavIconName, HeroIcon> = {
  dashboard: Squares2X2Icon,
  groups: UserGroupIcon,
  applications: DocumentTextIcon,
  access: ShieldCheckIcon,
};

const resolveIcon = (icon: NavItem["icon"]) =>
  typeof icon === "string" ? iconRegistry[icon] : icon;

const isActivePath = (pathname: string, href: string) =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

// Top-level rows (leaf links and group triggers); colors are set per state.
const rowBase =
  "flex min-h-[42px] items-center gap-3 rounded-[10px] px-3 text-[14.5px] transition-colors";

// Resting rows only: on the active leaf, hover:bg-white/5 would replace navy-800.
const rowRest = "font-medium text-on-dark hover:bg-white/5 hover:text-white";

// Icons sit muted at rest and turn gold when their row (or a child) is active.
const iconClass = (active: boolean) =>
  clsx("size-5 shrink-0", active ? "text-gold-500" : "text-muted-on-dark");

interface SidebarProps {
  /** The ministry and church shown under the logo. */
  context: ChurchContext;
  isOpen: boolean;
  onNavigate: () => void;
}

const LeafLink = ({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) => {
  const Icon = resolveIcon(item.icon);
  const active = isActivePath(pathname, item.href!);

  return (
    <NextLink
      aria-current={active ? "page" : undefined}
      className={clsx(
        rowBase,
        active ? "bg-navy-800 font-semibold text-white" : rowRest,
      )}
      href={item.href!}
      onClick={onNavigate}
    >
      <Icon className={iconClass(active)} strokeWidth={1.6} />
      <span className="flex-1">{item.label}</span>
    </NextLink>
  );
};

const CollapsibleItem = ({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) => {
  const Icon = resolveIcon(item.icon);
  const children = item.items ?? [];
  const hasActiveChild = children.some((child) => pathname === child.href);

  return (
    <Disclosure defaultExpanded={hasActiveChild}>
      <Disclosure.Trigger
        // A group never gets the filled active state: only its icon turns
        // gold, and the active child carries the highlight.
        className={clsx(rowBase, rowRest, "w-full")}
      >
        <Icon className={iconClass(hasActiveChild)} strokeWidth={1.6} />
        <span className="flex-1 text-left">{item.label}</span>
        <Disclosure.Indicator className="size-3.5 text-muted-on-dark" />
      </Disclosure.Trigger>
      <Disclosure.Content>
        <Disclosure.Body className="!p-0 !pt-0.5 !pb-1.5">
          <ul className="ml-[22px] flex flex-col gap-0.5 border-l border-white/12 pl-3.5">
            {children.map((child) => {
              const active = pathname === child.href;

              return (
                <li key={child.href}>
                  <NextLink
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-gold-500/14 font-semibold text-gold-300"
                        : "font-medium text-on-dark hover:bg-white/5 hover:text-white",
                    )}
                    href={child.href}
                    onClick={onNavigate}
                  >
                    {child.label}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
};

export const Sidebar = ({ context, isOpen, onNavigate }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        className={clsx(
          "fixed inset-0 z-40 bg-backdrop backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onNavigate}
      />

      <aside
        className={clsx(
          // The rail is navy in both modes (bg-rail), so its contents use the
          // raw on-dark palette rather than theme-aware tokens. The focus halo
          // is redefined too: light mode's gold-800 ring is meant for paper.
          // --focus covers HeroUI controls (ring-focus); --shadow-focus covers
          // our plain links (the global :focus-visible rule).
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-rail-edge bg-rail text-on-dark",
          "[--focus:var(--color-gold-500)] [--shadow-focus:0_0_0_2px_var(--color-navy-900),0_0_0_4px_var(--color-gold-500)]",
          "transition-transform duration-200 ease-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-4">
          <NextLink
            aria-label="ekklesiaio home"
            className="flex items-center rounded-lg"
            href="/"
            onClick={onNavigate}
          >
            <EkklesiaioLogo size={21} tone="on-dark" />
          </NextLink>
          <button
            aria-label="Close menu"
            className="rounded-lg p-1 text-muted-on-dark hover:bg-white/5 hover:text-white lg:hidden"
            onClick={onNavigate}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <ChurchContextCard className="mx-3.5 mb-3.5" context={context} />

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-1.5">
          {siteConfig.navItems.map((item) =>
            item.items ? (
              <CollapsibleItem
                key={item.label}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ) : (
              <LeafLink
                key={item.label}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ),
          )}
        </nav>

        <p className="px-5 pt-4 pb-5 text-xs text-muted-on-dark">
          Staff app · v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </aside>
    </>
  );
};
