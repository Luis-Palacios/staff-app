"use client";

import { useState } from "react";
import { Alert, Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { authButton, authStack } from "./auth-styles";
import { AuthTextField } from "./auth-text-field";

import { authClient } from "@/lib/auth/auth-client";
import { useAuthErrorMessage } from "@/lib/auth/use-auth-error-message";

export function ResendVerificationButton({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  const t = useTranslations("ResendVerificationButton");
  const authErrorMessage = useAuthErrorMessage();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setStatus("sending");
    setError(null);

    // No callbackURL: the email links to this app's /verify-email page, built
    // by auth-server, not to better-auth's redirecting endpoint.
    const { error: resendError } = await authClient.sendVerificationEmail({
      email,
    });

    if (resendError) {
      setError(authErrorMessage(resendError));
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
          label={t("email")}
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
            <Alert.Description>{t("sent")}</Alert.Description>
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
          {t("submit")}
        </Button>
      )}
    </div>
  );
}
