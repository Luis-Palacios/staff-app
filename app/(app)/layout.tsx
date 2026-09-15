import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/get-server-session";
import { AppShell } from "@/components/app-shell";
import { UserProvider } from "@/lib/contexts/user-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <UserProvider user={session.user}>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
