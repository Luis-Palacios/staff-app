import { SignInForm } from "./_components/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return <SignInForm initialEmail={email ?? null} />;
}
