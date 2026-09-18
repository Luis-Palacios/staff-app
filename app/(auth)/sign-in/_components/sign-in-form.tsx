"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  InputGroup,
  ProgressBar,
  ProgressBarTrack,
  TextField,
} from "@heroui/react";
import { Card } from "@heroui/react/card";
import { Label } from "@heroui/react/label";
import { Link } from "@heroui/react/link";

import { PasswordField } from "../../_components/password-field";

import { authClient } from "@/lib/auth/auth-client";

export function SignInForm({
  initialEmail,
  notice,
}: {
  initialEmail: string | null;
  notice: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const session = authClient.useSession();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      if (signInError.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/needs-verification?email=${encodeURIComponent(email)}`);

        return;
      }
      setError(signInError.message ?? "Sign in failed");

      return;
    }

    router.push("/");
  }

  if (session.isPending) {
    return (
      <ProgressBar isIndeterminate aria-label="Loading" className="w-72">
        <ProgressBarTrack>
          <ProgressBar.Fill />
        </ProgressBarTrack>
      </ProgressBar>
    );
  }

  if (session.data) {
    return (
      <Card.Root className="w-full max-w-sm md:max-w-md lg:max-w-xl">
        <Card.Header>
          <Card.Title className="text-lg">Signed in</Card.Title>
          <Card.Description className="text-base">
            {session.data.user.email}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-base text-muted-foreground">
            Role: {session.data.user.role ?? "(none)"}
          </p>
        </Card.Content>
        <Card.Footer>
          <Button variant="outline" onPress={() => authClient.signOut()}>
            Sign out
          </Button>
        </Card.Footer>
      </Card.Root>
    );
  }

  return (
    <form
      className="w-full max-w-sm md:max-w-md lg:max-w-xl"
      onSubmit={handleSubmit}
    >
      <Card.Root className="w-full">
        <Card.Header>
          <Card.Title className="text-lg">Sign in</Card.Title>
          <Card.Description className="text-base">
            Sign in to your staff-app account
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          {notice ? (
            <Alert status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{notice}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}

          <TextField isRequired type="email" value={email} onChange={setEmail}>
            <Label className="text-base">Email</Label>
            <InputGroup>
              <InputGroup.Input
                // eslint-disable-next-line jsx-a11y/no-autofocus -- first field of the sign-in form; focusing it on load is the expected pattern for a dedicated auth page
                autoFocus
                autoComplete="email"
                className="text-base"
              />
            </InputGroup>
          </TextField>

          <PasswordField
            isRequired
            autoComplete="current-password"
            label="Password"
            value={password}
            onChange={setPassword}
          />

          <Link
            className="w-fit text-base"
            href={
              email
                ? `/forgot-password?email=${encodeURIComponent(email)}`
                : "/forgot-password"
            }
          >
            Forgot password?
          </Link>

          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
        </Card.Content>

        <Card.Footer className="flex flex-col gap-3">
          <Button fullWidth type="submit">
            Sign in
          </Button>
          <p className="text-base text-muted-foreground">
            Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
          </p>
        </Card.Footer>
      </Card.Root>
    </form>
  );
}
