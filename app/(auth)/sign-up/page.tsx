import { SignUpForm } from "./_components/sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return <SignUpForm initialEmail={email ?? null} />;
}
