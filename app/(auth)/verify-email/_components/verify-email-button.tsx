"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { authButton, authStack } from "../../_components/auth-styles";
import { ResendVerificationButton } from "../../_components/resend-verification-button";

import { authClient } from "@/lib/auth/auth-client";
import { useAuthErrorMessage } from "@/lib/auth/use-auth-error-message";

type VerifyState =
  | { status: "idle" | "verifying" }
  // better-auth answers every token problem (expired, invalid, unknown user)
  // with 401; only then is a new email the way forward.
  | { status: "error"; message: string; tokenRejected: boolean };

export function VerifyEmailButton({
  token,
  email,
}: {
  token: string;
  email: string | null;
}) {
  const t = useTranslations("VerifyEmailButton");
  const authErrorMessage = useAuthErrorMessage();
  const router = useRouter();
  const [state, setState] = useState<VerifyState>({ status: "idle" });

  async function handleVerify() {
    setState({ status: "verifying" });

    // Through the same-origin /api/auth proxy, so the session cookie that
    // autoSignInAfterVerification sets lands on this app.
    const { error } = await authClient.verifyEmail({ query: { token } });

    if (error) {
      setState({
        status: "error",
        message: authErrorMessage(error),
        tokenRejected: error.status === 401,
      });

      return;
    }

    // An email that was already verified gets the same success answer, but
    // better-auth signs nobody in then. Without a session, sign in rather
    // than bounce off the (app) layout with no word that it worked.
    const { data: session } = await authClient.getSession();

    if (!session) {
      const emailQuery = email ? `&email=${encodeURIComponent(email)}` : "";

      router.push(`/sign-in?verified=1${emailQuery}`);

      return;
    }

    // The (app) layout routes on from here: needs-role or the dashboard.
    router.push("/");
  }

  const tokenRejected = state.status === "error" && state.tokenRejected;

  return (
    <div className={authStack}>
      {state.status === "error" ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{state.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {tokenRejected ? (
        <ResendVerificationButton initialEmail={email} />
      ) : (
        <Button
          fullWidth
          className={authButton}
          isPending={state.status === "verifying"}
          type="button"
          onPress={handleVerify}
        >
          {t("submit")}
        </Button>
      )}
    </div>
  );
}
