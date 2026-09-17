import Link from "next/link";

import { ResendVerificationButton } from "./_components/resend-verification-button";

export default async function NeedsVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <section className="flex max-w-sm flex-col gap-4">
      <h1 className="text-lg font-semibold">Check your email</h1>

      {email ? (
        <p>
          We sent a verification link to <strong>{email}</strong>. Click it,
          then sign in.
        </p>
      ) : (
        <p>We sent you a verification link by email. Click it, then sign in.</p>
      )}

      <ResendVerificationButton initialEmail={email ?? null} />

      <Link className="underline" href="/sign-in">
        Back to sign in
      </Link>
    </section>
  );
}
