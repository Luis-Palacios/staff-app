"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, InputGroup, TextField } from "@heroui/react";
import { Card } from "@heroui/react/card";
import { Label } from "@heroui/react/label";

import { PasswordField } from "../../_components/password-field";

import { authClient } from "@/lib/auth/auth-client";

export function SignUpForm({ initialEmail }: { initialEmail: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const { data, error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `${window.location.origin}/sign-in?verified=1`,
    });

    if (signUpError) {
      setError(signUpError.message ?? "Sign up failed");

      return;
    }

    if (data.token === null) {
      router.push(`/needs-verification?email=${encodeURIComponent(email)}`);

      return;
    }

    router.push("/");
  }

  return (
    <form
      className="w-full max-w-sm md:max-w-md lg:max-w-xl"
      onSubmit={handleSubmit}
    >
      <Card.Root className="w-full">
        <Card.Header>
          <Card.Title className="text-lg">Create an account</Card.Title>
          <Card.Description className="text-base">
            Sign up for staff-app
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <TextField isRequired type="text" value={name} onChange={setName}>
            <Label className="text-base">Name</Label>
            <InputGroup>
              <InputGroup.Input autoComplete="name" className="text-base" />
            </InputGroup>
          </TextField>

          <TextField
            isRequired
            isDisabled={initialEmail !== null}
            type="email"
            value={email}
            onChange={setEmail}
          >
            <Label className="text-base">Email</Label>
            <InputGroup>
              <InputGroup.Input autoComplete="email" className="text-base" />
            </InputGroup>
            {initialEmail !== null && (
              <p className="text-sm text-muted-foreground">
                Fixed by your invite — this email must match to activate it.
              </p>
            )}
          </TextField>

          <PasswordField
            isRequired
            autoComplete="new-password"
            label="Password"
            value={password}
            onChange={setPassword}
          />

          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
        </Card.Content>

        <Card.Footer>
          <Button fullWidth type="submit">
            Sign up
          </Button>
        </Card.Footer>
      </Card.Root>
    </form>
  );
}
