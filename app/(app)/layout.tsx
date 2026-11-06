import type { ConversationsSignal } from "@/components/sidebar";

import { getFeatures } from "@/api/members-api/client";
import { getConversationCounts } from "@/api/conversations-api/client";
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

  // A failed read hides the guest controls rather than the app.
  const features = await getFeatures().catch(() => ({ guestGroups: false }));

  return (
    <UserProvider
      features={features}
      permissions={session.permissions}
      user={session.user}
    >
      <AppShell context={context} conversations={conversations} locale={locale}>
        {children}
      </AppShell>
      <ToastHost />
    </UserProvider>
  );
}
