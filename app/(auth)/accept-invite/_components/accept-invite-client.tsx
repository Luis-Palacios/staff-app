"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar, ProgressBarTrack, buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { AuthHeading } from "../../_components/auth-heading";
import { authButton, authStack } from "../../_components/auth-styles";

import { authClient } from "@/lib/auth/auth-client";
import { useAuthErrorMessage } from "@/lib/auth/use-auth-error-message";

type ActivationState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "choose" };

export function AcceptInviteClient({
  token,
  email,
}: {
  token: string | null;
  email: string | null;
}) {
  const t = useTranslations("AcceptInvite");
  const authErrorMessage = useAuthErrorMessage();
  const router = useRouter();
  const [state, setState] = useState<ActivationState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        message: t("missingToken"),
      });

      return;
    }

    authClient.invite.activate({ token }).then(({ data, error }) => {
      if (error) {
        setState({
          status: "error",
          message:
            error.status === 429 ? authErrorMessage(error) : t("invalid"),
        });

        return;
      }

      if (data.action === "REDIRECT_TO_AFTER_UPGRADE") {
        router.push(data.redirectTo || "/");

        return;
      }

      setState({ status: "choose" });
    });
    // t and authErrorMessage change identity every render; the locale only
    // matters for the message text, which is fine to keep from first run.
  }, [token, router]);

  if (state.status === "loading") {
    return (
      <ProgressBar
        isIndeterminate
        aria-label={t("checking")}
        className="w-full"
      >
        <ProgressBarTrack>
          <ProgressBar.Fill />
        </ProgressBarTrack>
      </ProgressBar>
    );
  }

  if (state.status === "error") {
    return (
      <div className={authStack}>
        <AuthHeading title={t("invalidTitle")}>{state.message}</AuthHeading>
      </div>
    );
  }

  const emailQuery = email ? `?email=${encodeURIComponent(email)}` : "";

  return (
    <div className={authStack}>
      <AuthHeading title={t("title")}>{t("body")}</AuthHeading>
      <div className="flex flex-col gap-3 sm:flex-row">
        <NextLink
          className={buttonVariants({ fullWidth: true, className: authButton })}
          href={`/sign-up${emailQuery}`}
        >
          {t("createAccount")}
        </NextLink>
        <NextLink
          className={buttonVariants({
            fullWidth: true,
            variant: "outline",
            className: authButton,
          })}
          href={`/sign-in${emailQuery}`}
        >
          {t("signIn")}
        </NextLink>
      </div>
    </div>
  );
}
