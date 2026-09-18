import { SignInForm } from "./_components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; verified?: string; reset?: string }>;
}) {
  const { email, verified, reset } = await searchParams;

  const notice = reset
    ? "Your password has been reset. Sign in with your new password."
    : verified
      ? "Your email is verified. Sign in to continue."
      : null;

  return <SignInForm initialEmail={email ?? null} notice={notice} />;
}
