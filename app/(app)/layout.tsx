import { redirect } from "next/navigation";

import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { AppShell } from "@/components/app-shell";
import { UserProvider } from "@/lib/contexts/user-context";
import { AuthRole } from "@/lib/auth/roles";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.user.emailVerified) {
    redirect("/needs-verification");
  }

  if (session.user.role && session.user.role === AuthRole.Pending) {
    redirect("/needs-role");
  }

  return (
    <UserProvider user={session.user}>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
