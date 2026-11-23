import { getTranslations } from "next-intl/server";

import { SignInForm } from "./_components/sign-in-form";

import { safeReturnPath } from "@/lib/return-path";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    verified?: string;
    reset?: string;
    next?: string;
  }>;
}) {
  const { email, verified, reset, next } = await searchParams;
  const t = await getTranslations("SignInPage");

  const notice = reset
    ? t("notices.reset")
    : verified
      ? t("notices.verified")
      : null;

  return (
    <SignInForm
      initialEmail={email ?? null}
      notice={notice}
      returnTo={safeReturnPath(next) ?? "/"}
    />
  );
}
