"use client";

import { Avatar, Dropdown, InputGroup, Kbd, TextField } from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { ThemeSwitch } from "@/components/theme-switch";
import { MenuIcon, SearchIcon, Logo } from "@/components/icons";
import { useCurrentUser } from "@/lib/contexts/user-context";
import { authClient } from "@/lib/auth/auth-client";

interface TopbarProps {
  onMenuClick: () => void;
}

function getInitials(name: string): string {
  const [first, last] = name.trim().split(/\s+/);

  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const router = useRouter();
  const currentUser = useCurrentUser();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <header className="sticky top-0 z-30 flex h-auto items-center gap-3 border-b border-separator bg-background/70 px-4 backdrop-blur-lg p-4">
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
        <Dropdown.Root>
          <Dropdown.Trigger>
            <Avatar className="size-8 shrink-0" size="sm">
              <Avatar.Fallback>{getInitials(currentUser.name)}</Avatar.Fallback>
            </Avatar>
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
