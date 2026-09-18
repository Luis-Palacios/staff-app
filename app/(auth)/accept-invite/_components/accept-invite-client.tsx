"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    return <p>One moment…</p>;
  }

  if (state.status === "error") {
    return (
      <section className="flex max-w-sm flex-col gap-4">
        <h1 className="text-lg font-semibold">Invite not valid</h1>
        <p>{state.message}</p>
      </section>
    );
  }

  const emailQuery = email ? `?email=${encodeURIComponent(email)}` : "";

  return (
    <section className="flex max-w-sm flex-col gap-4">
      <h1 className="text-lg font-semibold">You&apos;ve been invited</h1>
      <p>
        Create an account to accept this invite, or sign in if you already have
        one.
      </p>
      <div className="flex gap-2">
        <button
          className="w-fit rounded border px-4 py-2"
          type="button"
          onClick={() => router.push(`/sign-up${emailQuery}`)}
        >
          Create account
        </button>
        <button
          className="w-fit rounded border px-4 py-2"
          type="button"
          onClick={() => router.push(`/sign-in${emailQuery}`)}
        >
          Sign in
        </button>
      </div>
    </section>
  );
}
