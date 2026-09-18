"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, InputGroup, ListBox, Select, TextField } from "@heroui/react";
import { Label } from "@heroui/react/label";

import { authClient } from "@/lib/auth/auth-client";
import { AuthRole, ROLE_LABELS } from "@/lib/auth/roles";

// Same "don't invite someone directly into pending" reasoning as AssignPendingRole's own
// ASSIGNABLE_ROLES filter (duplicated here rather than shared - see assign-pending-role.tsx).
const ASSIGNABLE_ROLES = (Object.keys(ROLE_LABELS) as AuthRole[]).filter(
  (role) => role !== AuthRole.Pending,
);

export function NewInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AuthRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !role) return;

    if (
      role === AuthRole.Admin &&
      !window.confirm(`Send an admin invite to ${email}?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: createError } = await authClient.invite.create({
      email,
      role,
      // redirectToSignUp/redirectToSignIn are deliberately not sent - auth-server's
      // sendUserInvitation builds its own accept-invite URL (see its auth.ts) rather than using
      // the plugin's own link-building, so these would never be read anyway. redirectToAfterUpgrade
      // is still real: persisted on the invite row itself and read back at click-time to redirect
      // here after the role-upgrade hook fires (see better-invite's hooks.ts).
      redirectToAfterUpgrade: `${window.location.origin}/`,
    });

    if (createError) {
      setError(createError.message ?? "Failed to send invite");
      setIsSubmitting(false);

      return;
    }

    setEmail("");
    setRole(null);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          isRequired
          isDisabled={isSubmitting}
          type="email"
          value={email}
          onChange={setEmail}
        >
          <Label>Email</Label>
          <InputGroup>
            <InputGroup.Input placeholder="person@example.com" />
          </InputGroup>
        </TextField>

        <Select.Root
          isDisabled={isSubmitting}
          placeholder="Choose a role"
          selectedKey={role}
          onSelectionChange={(key) => setRole(key as AuthRole | null)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {ASSIGNABLE_ROLES.map((r) => (
                <ListBox.Item key={r} id={r}>
                  {ROLE_LABELS[r]}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select.Root>

        <Button
          isDisabled={!email || !role}
          isPending={isSubmitting}
          onPress={handleSubmit}
        >
          Send invite
        </Button>
      </div>

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
