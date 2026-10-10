import NextLink from "next/link";

import { AuthHeading } from "../_components/auth-heading";
import { authFooterLine, authStack } from "../_components/auth-styles";

import { ResendVerificationButton } from "./_components/resend-verification-button";

import { textLink } from "@/components/primitives";

export default async function NeedsVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className={authStack}>
      <AuthHeading title="Check your email">
        {email ? (
          <>
            We sent a verification link to{" "}
            <strong className="text-heading">{email}</strong>. Click it, then
            sign in.
          </>
        ) : (
          "We sent you a verification link by email. Click it, then sign in."
        )}
      </AuthHeading>

      <ResendVerificationButton initialEmail={email ?? null} />

      <p className={authFooterLine}>
        <NextLink className={textLink()} href="/sign-in">
          Back to sign in
        </NextLink>
      </p>
    </div>
  );
}
