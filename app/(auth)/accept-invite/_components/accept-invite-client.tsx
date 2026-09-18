"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ProgressBar, ProgressBarTrack } from "@heroui/react";
import { Card } from "@heroui/react/card";

import { authClient } from "@/lib/auth/auth-client";

type ActivationState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "choose" };

export function AcceptInviteClient({
  token,
  email,
}: {
  token: string | null;
  email: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActivationState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        message: "This invite link is missing its token.",
      });

      return;
    }

    authClient.invite.activate({ token }).then(({ data, error }) => {
      if (error) {
        setState({
          status: "error",
          message:
            error.message ?? "This invite link is invalid or has expired.",
        });

        return;
      }

      if (data.action === "REDIRECT_TO_AFTER_UPGRADE") {
        router.push(data.redirectTo || "/");

        return;
      }

      setState({ status: "choose" });
    });
  }, [token, router]);

  if (state.status === "loading") {
    return (
      <ProgressBar
        isIndeterminate
        aria-label="Checking invite"
        className="w-72"
      >
        <ProgressBarTrack>
          <ProgressBar.Fill />
        </ProgressBarTrack>
      </ProgressBar>
    );
  }

  if (state.status === "error") {
    return (
      <Card.Root className="w-full max-w-sm md:max-w-md lg:max-w-xl">
        <Card.Header>
          <Card.Title className="text-lg">Invite not valid</Card.Title>
          <Card.Description className="text-base">
            {state.message}
          </Card.Description>
        </Card.Header>
      </Card.Root>
    );
  }

  const emailQuery = email ? `?email=${encodeURIComponent(email)}` : "";

  return (
    <Card.Root className="w-full max-w-sm md:max-w-md lg:max-w-xl">
      <Card.Header>
        <Card.Title className="text-lg">You&apos;ve been invited</Card.Title>
        <Card.Description className="text-base">
          Create an account to accept this invite, or sign in if you already
          have one.
        </Card.Description>
      </Card.Header>
      <Card.Footer className="flex gap-2">
        <Button fullWidth onPress={() => router.push(`/sign-up${emailQuery}`)}>
          Create account
        </Button>
        <Button
          fullWidth
          variant="outline"
          onPress={() => router.push(`/sign-in${emailQuery}`)}
        >
          Sign in
        </Button>
      </Card.Footer>
    </Card.Root>
  );
}
