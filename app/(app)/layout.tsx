import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/get-server-session";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <AppShell>{children}</AppShell>;
}
