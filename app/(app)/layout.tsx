import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";
import { AppShell } from "@/components/app-shell";
import { ToastHost } from "@/components/toast-host";
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

  return (
    <UserProvider permissions={session.permissions} user={session.user}>
      <AppShell context={context} locale={locale}>
        {children}
      </AppShell>
      <ToastHost />
    </UserProvider>
  );
}
