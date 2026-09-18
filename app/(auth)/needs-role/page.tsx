"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Card } from "@heroui/react/card";

import { authClient } from "@/lib/auth/auth-client";

export default function NeedsRolePage() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <Card.Root className="w-full max-w-sm md:max-w-md lg:max-w-xl">
      <Card.Header>
        <Card.Title className="text-lg">Access denied</Card.Title>
        <Card.Description className="text-base">
          You need to be assigned a role to access this application. Please
          contact your administrator to be assigned the appropriate role.
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Button fullWidth variant="danger-soft" onPress={handleSignOut}>
          Sign out
        </Button>
      </Card.Footer>
    </Card.Root>
  );
}
