import { requireStaffSession } from "@/api/auth-api/helpers/require-staff-session";
import { AppShell } from "@/components/app-shell";
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
    <UserProvider user={session.user}>
      <AppShell context={context} locale={locale}>
        {children}
      </AppShell>
    </UserProvider>
  );
}
