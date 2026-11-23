import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { NotificationsList } from "./_components/notifications-list";

import {
  getUnreadCount,
  listNotifications,
} from "@/api/notifications-api/client";
import { StaffAppPageHeader } from "@/components/staff-app-page-header";
import { getLocale } from "@/lib/locale";
import { toNotificationViews } from "@/lib/notifications/entry";

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Notifications");

  return { title: t("title") };
}

// For everyone signed in: the entries are the caller's own. While in-app notifications are off at
// the server there is no bell and no page. A failed read goes to the shell's error state.
export default async function NotificationsPage() {
  const [t, locale, count] = await Promise.all([
    getTranslations("Notifications"),
    getLocale(),
    getUnreadCount(),
  ]);

  if (!count.enabled) notFound();

  const page = await listNotifications({ limit: PAGE_SIZE });

  return (
    <>
      <StaffAppPageHeader description={t("subtitle")} title={t("title")} />
      <NotificationsList
        initial={{
          items: await toNotificationViews(page.items, locale),
          nextBefore: page.nextBefore,
        }}
        pageSize={PAGE_SIZE}
        unread={count.unread}
      />
    </>
  );
}
