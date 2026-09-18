"use client";
import type { SubmitEvent } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/auth-client";

// Deliberately bare (plain HTML, no HeroUI) — matches sign-in/page.tsx's Phase 2 style.
export function SignUpForm({ initialEmail }: { initialEmail: string | null }) {
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
      callbackURL: `${window.location.origin}/sign-in?verified=1`,
    });

    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed");

      return;
    }

    if (data.token === null) {
      router.push(`/needs-verification?email=${encodeURIComponent(email)}`);

      return;
    }

    router.push("/");
  }

  return (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1">
        Name
        <input
          className="rounded border px-3 py-2"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1">
        Email
        <input
          className="rounded border px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
          disabled={initialEmail !== null}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {initialEmail !== null && (
          <span className="text-xs text-gray-500">
            Fixed by your invite — this email must match to activate it.
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        Password
        <input
          className="rounded border px-3 py-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? <p className="text-red-500">{error}</p> : null}

      <button className="w-fit rounded border px-4 py-2" type="submit">
        Sign up
      </button>
    </form>
  );
}
