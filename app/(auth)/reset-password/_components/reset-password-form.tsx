"use client";

import type { SubmitEvent } from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth/auth-client";

// Deliberately bare (plain HTML, no HeroUI) — matches sign-in-form.tsx/sign-up-form.tsx's style.
export function ResetPasswordForm({
  invalidLink,
  token,
}: {
  invalidLink: boolean;
  token: string | null;
}) {
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
      setError("Passwords don't match");

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
      setError(resetError.message ?? "Failed to reset password");

      return;
    }

    router.push("/sign-in?reset=1");
  }

  if (tokenInvalid) {
    return (
      <section className="flex max-w-sm flex-col gap-4">
        <h1 className="text-lg font-semibold">Reset link no longer valid</h1>
        <p>
          This password reset link has expired or was already used. Request a
          new one to continue.
        </p>
        <Link
          className="w-fit rounded border px-4 py-2"
          href="/forgot-password"
        >
          Request a new link
        </Link>
        <Link className="underline" href="/sign-in">
          Back to sign in
        </Link>
      </section>
    );
  }

  return (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1">
        New password
        <input
          className="rounded border px-3 py-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        Confirm new password
        <input
          className="rounded border px-3 py-2"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>

      {error ? <p className="text-red-500">{error}</p> : null}

      <button className="w-fit rounded border px-4 py-2" type="submit">
        Reset password
      </button>
    </form>
  );
}
