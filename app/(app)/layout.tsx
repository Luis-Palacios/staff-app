import type { UnreadCount } from "@/api/notifications-api/types";
import type { ConversationsSignal } from "@/components/sidebar";

import { getFeatures } from "@/api/members-api/client";
import { getConversationCounts } from "@/api/conversations-api/client";
import { getUnreadCount } from "@/api/notifications-api/client";
import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";
import { AppShell } from "@/components/app-shell";
import { ToastHost } from "@/components/toast-host";
import { canSeeConversationsInbox } from "@/lib/auth/permissions";
import { UserProvider } from "@/lib/contexts/user-context";
import { getLocale } from "@/lib/locale";
import { getChurchContext } from "@/lib/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaffSession();
  const context = await getChurchContext();
  const locale = await getLocale();
  // The sidebar's gold number and unread dot, from one read. A failed read hides both; the page
  // never waits on it for anyone outside the audience.
  const noSignal: ConversationsSignal = { waiting: 0, unread: false };
  // The bell's count. Starts now so it reads beside the counts below. A failed read hides the bell
  // (as in-app being off does) rather than the app; the bell then reads again on the next
  // navigation or focus.
  const noNotifications: UnreadCount = { enabled: false, unread: 0 };
  const notificationsRead = getUnreadCount().catch(() => noNotifications);
  const conversations = canSeeConversationsInbox(session.permissions)
    ? await getConversationCounts()
        .then(
          ({ needsMyReply, hasUnread }): ConversationsSignal => ({
            waiting: needsMyReply,
            unread: hasUnread,
          }),
        )
        .catch(() => noSignal)
    : noSignal;

  const notifications = await notificationsRead;

  // A failed read hides the guest controls rather than the app.
  const features = await getFeatures().catch(() => ({ guestGroups: false }));

  return (
    <UserProvider
      features={features}
      permissions={session.permissions}
      user={session.user}
    >
      <AppShell
        context={context}
        conversations={conversations}
        locale={locale}
        notifications={notifications}
      >
        {children}
      </AppShell>
      <ToastHost />
    </UserProvider>
  );
}
