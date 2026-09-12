"use client";

import type { NavIconName, NavItem } from "@/config/site";

import { Disclosure } from "@heroui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import {
  ApplicationsIcon,
  BalancesIcon,
  CloseIcon,
  DashboardIcon,
  GroupsIcon,
  Logo,
  ReportsIcon,
} from "@/components/icons";
import { siteConfig } from "@/config/site";

const iconRegistry: Record<
  NavIconName,
  (props: { className?: string }) => React.ReactElement
> = {
  dashboard: DashboardIcon,
  groups: GroupsIcon,
  applications: ApplicationsIcon,
  reports: ReportsIcon,
  balances: BalancesIcon,
};

const resolveIcon = (icon: NavItem["icon"]) =>
  typeof icon === "string" ? iconRegistry[icon] : icon;

const isActivePath = (pathname: string, href: string) =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

const rowBase =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";

interface SidebarProps {
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
      className={clsx(
        rowBase,
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-foreground hover:bg-surface-secondary",
      )}
      href={item.href!}
      onClick={onNavigate}
    >
      <Icon className="size-5 shrink-0" />
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
        className={clsx(
          rowBase,
          "w-full text-foreground hover:bg-surface-secondary",
          hasActiveChild && "text-accent",
        )}
      >
        <Icon className="size-5 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <Disclosure.Indicator />
      </Disclosure.Trigger>
      <Disclosure.Content>
        <Disclosure.Body className="!p-0 !pt-1">
          <ul className="ml-4 flex flex-col gap-1 border-l border-separator pl-3">
            {children.map((child) => {
              const active = pathname === child.href;

              return (
                <li key={child.href}>
                  <NextLink
                    className={clsx(
                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted hover:bg-surface-secondary hover:text-foreground",
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

export const Sidebar = ({ isOpen, onNavigate }: SidebarProps) => {
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
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-separator bg-background",
          "transition-transform duration-200 ease-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-auto items-center justify-center gap-2 border-b border-separator px-4 pt-1 pb-1">
          <NextLink
            className="flex items-center gap-2 font-semibold"
            href="/"
            onClick={onNavigate}
          >
            <Logo size={60} />
          </NextLink>
          <button
            aria-label="Close menu"
            className="rounded-lg p-1 text-muted hover:bg-surface-secondary lg:hidden"
            onClick={onNavigate}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
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
      </aside>
    </>
  );
};
