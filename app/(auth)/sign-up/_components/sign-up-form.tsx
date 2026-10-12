"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Button } from "@heroui/react";
import NextLink from "next/link";

import { AuthHeading } from "../../_components/auth-heading";
import {
  authButton,
  authFooterLine,
  authStack,
} from "../../_components/auth-styles";
import { AuthTextField } from "../../_components/auth-text-field";
import { PasswordField } from "../../_components/password-field";

import { textLink } from "@/components/primitives";
import { authClient } from "@/lib/auth/auth-client";
import { useAuthErrorMessage } from "@/lib/auth/use-auth-error-message";

export function SignUpForm({ initialEmail }: { initialEmail: string | null }) {
  const t = useTranslations("SignUpForm");
  const authErrorMessage = useAuthErrorMessage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const { data, error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setError(authErrorMessage(signUpError));

      return;
    }

    if (data.token === null) {
      router.push(`/needs-verification?email=${encodeURIComponent(email)}`);

      return;
    }

    router.push("/");
  }

  return (
    <form className={authStack} onSubmit={handleSubmit}>
      <AuthHeading title={t("title")}>{t("subtitle")}</AuthHeading>

      <AuthTextField
        isRequired
        autoComplete="name"
        // eslint-disable-next-line jsx-a11y/no-autofocus -- first enabled field when email is fixed by an invite link; focusing it on load is the expected pattern for a dedicated auth page
        autoFocus={initialEmail !== null}
        label={t("name")}
        value={name}
        onChange={setName}
      />

      <AuthTextField
        isRequired
        autoComplete="email"
        // eslint-disable-next-line jsx-a11y/no-autofocus -- first field when email isn't fixed by an invite link; focusing it on load is the expected pattern for a dedicated auth page
        autoFocus={initialEmail === null}
        description={initialEmail !== null ? t("emailFixed") : undefined}
        isDisabled={initialEmail !== null}
        label={t("email")}
        type="email"
        value={email}
        onChange={setEmail}
      />

      <PasswordField
        isRequired
        autoComplete="new-password"
        label={t("password")}
        value={password}
        onChange={setPassword}
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
      <p className={authFooterLine}>
        {t("haveAccount")}{" "}
        <NextLink className={textLink()} href="/sign-in">
          {t("signIn")}
        </NextLink>
      </p>
    </form>
  );
}
