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
  // The sidebar badge. A failed read just hides it; the page never waits on it for anyone outside
  // the audience.
  const conversationsWaiting = canSeeConversationsInbox(session.permissions)
    ? await getConversationCounts()
        .then(({ needsMyReply }) => needsMyReply)
        .catch(() => 0)
    : 0;

  return (
    <UserProvider permissions={session.permissions} user={session.user}>
      <AppShell
        context={context}
        conversationsWaiting={conversationsWaiting}
        locale={locale}
      >
        {children}
      </AppShell>
      <ToastHost />
    </UserProvider>
  );
}
