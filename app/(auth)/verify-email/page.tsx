import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthHeading } from "../_components/auth-heading";
import { authFooterLine, authStack } from "../_components/auth-styles";
import { ResendVerificationButton } from "../_components/resend-verification-button";

import { VerifyEmailButton } from "./_components/verify-email-button";

import { textLink } from "@/components/primitives";

// Landing page for the verification email link (built in auth-server's
// sendVerificationEmail). Loading it changes nothing: the token is only used
// when the user presses the button, so link scanners can't consume it.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const t = await getTranslations("VerifyEmailPage");

  return (
    <div className={authStack}>
      {token ? (
        <>
          <AuthHeading title={t("title")}>
            {email
              ? t.rich("bodyWithEmail", {
                  email,
                  emailTag: (chunks) => (
                    <strong className="text-heading">{chunks}</strong>
                  ),
                })
              : t("body")}
          </AuthHeading>
          <VerifyEmailButton email={email ?? null} token={token} />
        </>
      ) : (
        <>
          <AuthHeading title={t("invalidTitle")}>
            {t("missingToken")}
          </AuthHeading>
          <ResendVerificationButton initialEmail={email ?? null} />
        </>
      )}

      <p className={authFooterLine}>
        <NextLink className={textLink()} href="/sign-in">
          {t("backToSignIn")}
        </NextLink>
      </p>
    </div>
  );
}
