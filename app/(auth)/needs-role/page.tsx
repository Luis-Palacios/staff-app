"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { AuthHeading } from "../_components/auth-heading";
import { authButton, authStack } from "../_components/auth-styles";

import { authClient } from "@/lib/auth/auth-client";

export default function NeedsRolePage() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <div className={authStack}>
      <AuthHeading title="Access denied">
        You need to be assigned a role to access this application. Please
        contact your administrator to be assigned the appropriate role.
      </AuthHeading>
      <Button
        fullWidth
        className={authButton}
        variant="danger-soft"
        onPress={handleSignOut}
      >
        Sign out
      </Button>
    </div>
  );
}
