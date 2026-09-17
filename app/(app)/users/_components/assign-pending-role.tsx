"use client";

import type { AuthRole } from "@/api/auth-api/types";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ListBox, Select } from "@heroui/react";

import { ROLE_LABELS } from "./role-display";

import { authClient } from "@/lib/auth/auth-client";

const ASSIGNABLE_ROLES = (Object.keys(ROLE_LABELS) as AuthRole[]).filter(
  (role) => role !== "pending",
);

export function AssignPendingRole({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AuthRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!selectedRole) return;

    if (
      selectedRole === "admin" &&
      !window.confirm(`Assign the Admin role to ${userName}?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: setRoleError } = await authClient.admin.setRole({
      userId,
      role: selectedRole,
    });

    if (setRoleError) {
      setError(setRoleError.message ?? "Failed to assign role");
      setIsSubmitting(false);

      return;
    }

    // Left true deliberately: the row stops rendering this control once router.refresh()'s
    // fresh data lands (the user is no longer "pending"), so there's no success state to reset.
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Select.Root
          isDisabled={isSubmitting}
          placeholder="Choose"
          selectedKey={selectedRole}
          onSelectionChange={(key) => setSelectedRole(key as AuthRole | null)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {ASSIGNABLE_ROLES.map((role) => (
                <ListBox.Item key={role} id={role}>
                  {ROLE_LABELS[role]}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select.Root>

        <Button
          isDisabled={!selectedRole}
          isPending={isSubmitting}
          size="sm"
          onPress={handleAssign}
        >
          Assign
        </Button>
      </div>

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
