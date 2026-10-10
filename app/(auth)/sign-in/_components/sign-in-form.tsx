"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, ProgressBar, ProgressBarTrack } from "@heroui/react";
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

export function SignInForm({
  initialEmail,
  notice,
}: {
  initialEmail: string | null;
  notice: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const session = authClient.useSession();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      if (signInError.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/needs-verification?email=${encodeURIComponent(email)}`);

        return;
      }
      setError(signInError.message ?? "Sign in failed");

      return;
    }

    router.push("/");
  }

  if (session.isPending || session.data) {
    return (
      <ProgressBar isIndeterminate aria-label="Loading" className="w-full">
        <ProgressBarTrack>
          <ProgressBar.Fill />
        </ProgressBarTrack>
      </ProgressBar>
    );
  }

  return (
    <form className={authStack} onSubmit={handleSubmit}>
      <AuthHeading title="Sign in">
        Use the email your church invited you with.
      </AuthHeading>

      {notice ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <AuthTextField
        // eslint-disable-next-line jsx-a11y/no-autofocus -- first field of the sign-in form; focusing it on load is the expected pattern for a dedicated auth page
        autoFocus
        isRequired
        autoComplete="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
      />

      <PasswordField
        isRequired
        autoComplete="current-password"
        label="Password"
        labelAction={
          <NextLink
            className={textLink({ className: "text-sm" })}
            href={
              email
                ? `/forgot-password?email=${encodeURIComponent(email)}`
                : "/forgot-password"
            }
          >
            Forgot password?
          </NextLink>
        }
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
        Sign in
      </Button>
      <p className={authFooterLine}>
        Don&apos;t have an account?{" "}
        <NextLink className={textLink()} href="/sign-up">
          Sign up
        </NextLink>
      </p>
    </form>
  );
}
