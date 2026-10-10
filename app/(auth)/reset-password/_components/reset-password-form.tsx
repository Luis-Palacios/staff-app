"use client";

import type { SubmitEvent } from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, buttonVariants } from "@heroui/react";
import NextLink from "next/link";

import { AuthHeading } from "../../_components/auth-heading";
import {
  authButton,
  authFooterLine,
  authStack,
} from "../../_components/auth-styles";
import { PasswordField } from "../../_components/password-field";

import { textLink } from "@/components/primitives";
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
      <div className={authStack}>
        <AuthHeading title="Reset link no longer valid">
          This password reset link has expired or was already used. Request a
          new one to continue.
        </AuthHeading>
        <NextLink
          className={buttonVariants({
            fullWidth: true,
            className: authButton,
          })}
          href="/forgot-password"
        >
          Request a new link
        </NextLink>
        <p className={authFooterLine}>
          <NextLink className={textLink()} href="/sign-in">
            Back to sign in
          </NextLink>
        </p>
      </div>
    );
  }

  return (
    <form className={authStack} onSubmit={handleSubmit}>
      <AuthHeading title="Reset password">
        Choose a new password below.
      </AuthHeading>

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

      <Button fullWidth className={authButton} type="submit">
        Reset password
      </Button>
    </form>
  );
}
