"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { authClient } from "@/lib/auth/auth-client";

export default function NeedsRolePage() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <section className="flex max-w-sm flex-col gap-4">
      <h1 className="text-lg font-semibold">Access Denied</h1>
      <p className="text-sm text-muted-foreground">
        You need to be assigned a role to access this application.
      </p>
      <p className="text-sm text-muted-foreground">
        Please contact your administrator to be assigned the appropriate role.
      </p>
      <Button variant="danger-soft" onClick={handleSignOut}>
        Sign Out
      </Button>
    </section>
  );
}
