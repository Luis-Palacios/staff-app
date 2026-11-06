"use client";

import type { ConversationsSignal } from "@/components/sidebar";
import type { ChurchContext } from "@/config/site";
import type { Locale } from "@/lib/locale-shared";

import { useEffect, useState } from "react";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

type AppShellProps = {
  children: React.ReactNode;
  context: ChurchContext;
  locale: Locale;
  /** The sidebar's Conversations number and unread dot. */
  conversations: ConversationsSignal;
};

export const AppShell = ({
  children,
  context,
  locale,
  conversations,
}: AppShellProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Lock body scroll while the mobile sidebar overlay is open.
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    // `--topbar-height` is the sticky top bar's height. Anything else that sticks while the page
    // scrolls (the report list's headers) docks below it with `top-(--topbar-height)`.
    <div className="flex min-h-screen [--topbar-height:4rem] lg:[--topbar-height:72px]">
      <Sidebar
        context={context}
        conversations={conversations}
        isOpen={isSidebarOpen}
        onNavigate={() => setIsSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          context={context}
          locale={locale}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
