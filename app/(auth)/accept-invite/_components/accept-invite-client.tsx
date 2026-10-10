"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar, ProgressBarTrack, buttonVariants } from "@heroui/react";
import NextLink from "next/link";

import { AuthHeading } from "../../_components/auth-heading";
import { authButton, authStack } from "../../_components/auth-styles";

import { authClient } from "@/lib/auth/auth-client";

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
  const router = useRouter();
  const [state, setState] = useState<ActivationState>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        message: "This invite link is missing its token.",
      });

      return;
    }

    authClient.invite.activate({ token }).then(({ data, error }) => {
      if (error) {
        setState({
          status: "error",
          message:
            error.message ?? "This invite link is invalid or has expired.",
        });

        return;
      }

      if (data.action === "REDIRECT_TO_AFTER_UPGRADE") {
        router.push(data.redirectTo || "/");

        return;
      }

      setState({ status: "choose" });
    });
  }, [token, router]);

  if (state.status === "loading") {
    return (
      <ProgressBar
        isIndeterminate
        aria-label="Checking invite"
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
        <AuthHeading title="Invite not valid">{state.message}</AuthHeading>
      </div>
    );
  }

  const emailQuery = email ? `?email=${encodeURIComponent(email)}` : "";

  return (
    <div className={authStack}>
      <AuthHeading title="You've been invited">
        Create an account to accept this invite, or sign in if you already have
        one.
      </AuthHeading>
      <div className="flex flex-col gap-3 sm:flex-row">
        <NextLink
          className={buttonVariants({ fullWidth: true, className: authButton })}
          href={`/sign-up${emailQuery}`}
        >
          Create account
        </NextLink>
        <NextLink
          className={buttonVariants({
            fullWidth: true,
            variant: "outline",
            className: authButton,
          })}
          href={`/sign-in${emailQuery}`}
        >
          Sign in
        </NextLink>
      </div>
    </div>
  );
}
