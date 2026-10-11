"use client";

import type { SubmitEvent } from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { useAuthErrorMessage } from "@/lib/auth/use-auth-error-message";

export function ResetPasswordForm({
  invalidLink,
  token,
}: {
  invalidLink: boolean;
  token: string | null;
}) {
  const t = useTranslations("ResetPasswordForm");
  const authErrorMessage = useAuthErrorMessage();
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
      setError(t("mismatch"));

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
      setError(authErrorMessage(resetError));

      return;
    }

    router.push("/sign-in?reset=1");
  }

  if (tokenInvalid) {
    return (
      <div className={authStack}>
        <AuthHeading title={t("invalidTitle")}>{t("invalidBody")}</AuthHeading>
        <NextLink
          className={buttonVariants({
            fullWidth: true,
            className: authButton,
          })}
          href="/forgot-password"
        >
          {t("requestNew")}
        </NextLink>
        <p className={authFooterLine}>
          <NextLink className={textLink()} href="/sign-in">
            {t("backToSignIn")}
          </NextLink>
        </p>
      </div>
    );
  }

  return (
    <form className={authStack} onSubmit={handleSubmit}>
      <AuthHeading title={t("title")}>{t("subtitle")}</AuthHeading>

      <PasswordField
        isRequired
        autoComplete="new-password"
        label={t("newPassword")}
        value={password}
        onChange={setPassword}
      />

      <PasswordField
        isRequired
        autoComplete="new-password"
        label={t("confirmPassword")}
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
        {t("submit")}
      </Button>
    </form>
  );
}
