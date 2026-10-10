"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { Alert, Button } from "@heroui/react";
import NextLink from "next/link";

import { AuthHeading } from "../../_components/auth-heading";
import {
  authButton,
  authFooterLine,
  authStack,
} from "../../_components/auth-styles";
import { AuthTextField } from "../../_components/auth-text-field";

import { textLink } from "@/components/primitives";
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

  const backToSignIn = (
    <p className={authFooterLine}>
      <NextLink className={textLink()} href="/sign-in">
        Back to sign in
      </NextLink>
    </p>
  );

  if (status === "sent") {
    return (
      <div className={authStack}>
        <AuthHeading title="Check your email">
          If <strong className="text-heading">{email}</strong> has an account,
          we sent a link to reset its password.
        </AuthHeading>
        {backToSignIn}
      </div>
    );
  }

  return (
    <form className={authStack} onSubmit={handleSubmit}>
      <AuthHeading title="Forgot password">
        We&apos;ll email you a link to reset it.
      </AuthHeading>

      <AuthTextField
        // eslint-disable-next-line jsx-a11y/no-autofocus -- only field on this page; focusing it on load is the expected pattern for a dedicated auth page
        autoFocus
        isRequired
        autoComplete="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
      />

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Button
        fullWidth
        className={authButton}
        isPending={status === "sending"}
        type="submit"
      >
        Send reset link
      </Button>
      {backToSignIn}
    </form>
  );
}
