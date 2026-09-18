import { ResetPasswordForm } from "./_components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <ResetPasswordForm invalidLink={Boolean(error)} token={token ?? null} />
  );
}
