"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/auth-client";

export function ResendVerificationButton({
  initialEmail,
}: {
  initialEmail: string | null;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setStatus("sending");
    setError(null);

    const { error: resendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/sign-in?verified=1`,
    });

    if (resendError) {
      setError(resendError.message ?? "Failed to resend email");
      setStatus("idle");

      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex flex-col gap-2">
      {initialEmail === null ? (
        <label className="flex flex-col gap-1">
          Email
          <input
            className="rounded border px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
      ) : null}

      {error ? <p className="text-red-500">{error}</p> : null}

      {status === "sent" ? (
        <p>Verification email sent — check your inbox.</p>
      ) : (
        <button
          className="w-fit rounded border px-4 py-2"
          disabled={status === "sending" || !email}
          type="button"
          onClick={handleResend}
        >
          {status === "sending" ? "Sending…" : "Resend verification email"}
        </button>
      )}
    </div>
  );
}
