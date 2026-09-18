"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { Alert, Button, InputGroup, TextField } from "@heroui/react";
import { Card } from "@heroui/react/card";
import { Label } from "@heroui/react/label";
import { Link } from "@heroui/react/link";

import { authClient } from "@/lib/auth/auth-client";

export function ForgotPasswordForm({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message ?? "Failed to send reset link");
      setStatus("idle");

      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <Card.Root className="w-full max-w-sm md:max-w-md lg:max-w-xl">
        <Card.Header>
          <Card.Title className="text-lg">Check your email</Card.Title>
          <Card.Description className="text-base">
            If <strong>{email}</strong> has an account, we sent a link to reset
            its password.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="flex flex-col">
          <Link className="text-base" href="/sign-in">
            Back to sign in
          </Link>
        </Card.Footer>
      </Card.Root>
    );
  }

  return (
    <form
      className="w-full max-w-sm md:max-w-md lg:max-w-xl"
      onSubmit={handleSubmit}
    >
      <Card.Root className="w-full">
        <Card.Header>
          <Card.Title className="text-lg">Forgot password</Card.Title>
          <Card.Description className="text-base">
            We&apos;ll email you a link to reset it.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <TextField isRequired type="email" value={email} onChange={setEmail}>
            <Label className="text-base">Email</Label>
            <InputGroup>
              <InputGroup.Input
                // eslint-disable-next-line jsx-a11y/no-autofocus -- only field on this page; focusing it on load is the expected pattern for a dedicated auth page
                autoFocus
                autoComplete="email"
                className="text-base"
              />
            </InputGroup>
          </TextField>

          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
        </Card.Content>

        <Card.Footer className="flex flex-col gap-3">
          <Button fullWidth isPending={status === "sending"} type="submit">
            Send reset link
          </Button>
          <Link className="text-base" href="/sign-in">
            Back to sign in
          </Link>
        </Card.Footer>
      </Card.Root>
    </form>
  );
}
