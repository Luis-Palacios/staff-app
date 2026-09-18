"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth/auth-client";

// Deliberately bare (plain HTML, no HeroUI) — matches sign-in-form.tsx/sign-up-form.tsx's style.
export function ForgotPasswordForm({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message ?? "Failed to send reset link");
      setStatus("idle");

      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <section className="flex max-w-sm flex-col gap-4">
        <h1 className="text-lg font-semibold">Check your email</h1>
        <p>
          If <strong>{email}</strong> has an account, we sent a link to reset
          its password.
        </p>
        <Link className="underline" href="/sign-in">
          Back to sign in
        </Link>
      </section>
    );
  }

  return (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1">
        Email
        <input
          className="rounded border px-3 py-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {error ? <p className="text-red-500">{error}</p> : null}

      <button
        className="w-fit rounded border px-4 py-2"
        disabled={status === "sending"}
        type="submit"
      >
        {status === "sending" ? "Sending…" : "Send reset link"}
      </button>

      <p>
        <Link className="underline" href="/sign-in">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
