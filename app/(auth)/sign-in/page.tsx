"use client";

import type { FormEvent } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

// Deliberately bare (plain HTML, no HeroUI) — this page exists to prove the session round-trip
// from staff-app to auth-server works end-to-end (Phase 2 of docs/AUTH-INTEGRATION-ROADMAP.md).
// It gets replaced by better-auth-ui in Phase 8.
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const session = authClient.useSession();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message ?? "Sign in failed");

      return;
    }

    router.push("/");
  }

  if (session.isPending) {
    return <p>Loading session…</p>;
  }

  if (session.data) {
    return (
      <section className="flex flex-col gap-4">
        <p>Signed in as {session.data.user.email}</p>
        <p>Role: {session.data.user.role ?? "(none)"}</p>
        <button
          className="w-fit rounded border px-4 py-2"
          type="button"
          onClick={() => authClient.signOut()}
        >
          Sign out
        </button>
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
        Sign in
      </button>
    </form>
  );
}
