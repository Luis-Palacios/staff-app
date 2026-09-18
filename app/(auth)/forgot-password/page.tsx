import { ForgotPasswordForm } from "./_components/forgot-password-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return <ForgotPasswordForm initialEmail={email ?? null} />;
}
