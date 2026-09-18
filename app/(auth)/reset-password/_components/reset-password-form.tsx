"use client";

import type { SubmitEvent } from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button } from "@heroui/react";
import { Card } from "@heroui/react/card";
import { Link } from "@heroui/react/link";

import { PasswordField } from "../../_components/password-field";

import { authClient } from "@/lib/auth/auth-client";

export function ResetPasswordForm({
  invalidLink,
  token,
}: {
  invalidLink: boolean;
  token: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tokenInvalid, setTokenInvalid] = useState(invalidLink || !token);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setTokenInvalid(true);

      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");

      return;
    }

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (resetError) {
      if (resetError.code === "INVALID_TOKEN") {
        setTokenInvalid(true);

        return;
      }
      setError(resetError.message ?? "Failed to reset password");

      return;
    }

    router.push("/sign-in?reset=1");
  }

  if (tokenInvalid) {
    return (
      <Card.Root className="w-full max-w-sm md:max-w-md lg:max-w-xl">
        <Card.Header>
          <Card.Title className="text-lg">
            Reset link no longer valid
          </Card.Title>
          <Card.Description className="text-base">
            This password reset link has expired or was already used. Request a
            new one to continue.
          </Card.Description>
        </Card.Header>
        <Card.Footer className="flex flex-col gap-3">
          <Button fullWidth onPress={() => router.push("/forgot-password")}>
            Request a new link
          </Button>
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
          <Card.Title className="text-lg">Reset password</Card.Title>
          <Card.Description className="text-base">
            Choose a new password below.
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <PasswordField
            isRequired
            autoComplete="new-password"
            label="New password"
            value={password}
            onChange={setPassword}
          />

          <PasswordField
            isRequired
            autoComplete="new-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
        </Card.Content>

        <Card.Footer>
          <Button fullWidth type="submit">
            Reset password
          </Button>
        </Card.Footer>
      </Card.Root>
    </form>
  );
}
