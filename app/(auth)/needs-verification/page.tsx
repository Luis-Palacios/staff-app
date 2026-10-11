import NextLink from "next/link";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("NeedsVerificationPage");

  return (
    <div className={authStack}>
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

      <ResendVerificationButton initialEmail={email ?? null} />

      <p className={authFooterLine}>
        <NextLink className={textLink()} href="/sign-in">
          {t("backToSignIn")}
        </NextLink>
      </p>
    </div>
  );
}
