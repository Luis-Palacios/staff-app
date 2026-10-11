import { getTranslations } from "next-intl/server";

import { SignInForm } from "./_components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; verified?: string; reset?: string }>;
}) {
  const { email, verified, reset } = await searchParams;
  const t = await getTranslations("SignInPage");

  const notice = reset
    ? t("notices.reset")
    : verified
      ? t("notices.verified")
      : null;

  return <SignInForm initialEmail={email ?? null} notice={notice} />;
}
