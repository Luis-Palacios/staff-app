"use client";

import { useState } from "react";
import { Alert, Button } from "@heroui/react";

import { authButton, authStack } from "../../_components/auth-styles";
import { AuthTextField } from "../../_components/auth-text-field";

import { authClient } from "@/lib/auth/auth-client";

export function ResendVerificationButton({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setStatus("sending");
    setError(null);

    const { error: resendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/sign-in?verified=1`,
    });

    if (resendError) {
      setError(resendError.message ?? "Failed to resend email");
      setStatus("idle");

      return;
    }

    setStatus("sent");
  }

  return (
    <div className={authStack}>
      {initialEmail === null ? (
        <AuthTextField
          isRequired
          autoComplete="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
        />
      ) : null}

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {status === "sent" ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              Verification email sent — check your inbox.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <Button
          fullWidth
          className={authButton}
          isDisabled={!email}
          isPending={status === "sending"}
          type="button"
          onPress={handleResend}
        >
          Resend verification email
        </Button>
      )}
    </div>
  );
}
