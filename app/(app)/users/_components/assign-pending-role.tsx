"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ListBox, Select } from "@heroui/react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { authClient } from "@/lib/auth/auth-client";
import { AuthRole, ROLE_LABELS } from "@/lib/auth/roles";

const ASSIGNABLE_ROLES = (Object.keys(ROLE_LABELS) as AuthRole[]).filter(
  (role) => role !== AuthRole.Pending,
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Admin is the one role that needs a second look before it's granted.
  function handleAssign() {
    if (!selectedRole) return;

    if (selectedRole === AuthRole.Admin) {
      setIsConfirmOpen(true);

      return;
    }

    assign(selectedRole);
  }

  async function assign(role: AuthRole) {
    setIsSubmitting(true);
    setError(null);

    const { error: setRoleError } = await authClient.admin.setRole({
      userId,
      role,
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
          aria-label={`Role for ${userName}`}
          isDisabled={isSubmitting}
          placeholder="Choose"
          selectedKey={selectedRole}
          onSelectionChange={(key) => setSelectedRole(key as AuthRole | null)}
        >
          <Select.Trigger className="h-[34px] min-h-[34px] min-w-[132px] items-center rounded-control py-0 text-[13px]">
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
          className="h-[34px] px-3 text-[13px] font-semibold md:h-[34px]"
          isDisabled={!selectedRole}
          isPending={isSubmitting}
          size="sm"
          onPress={handleAssign}
        >
          Assign
        </Button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <ConfirmDialog
        confirmLabel="Make admin"
        isOpen={isConfirmOpen}
        title="Assign the Admin role?"
        onConfirm={() => assign(AuthRole.Admin)}
        onOpenChange={setIsConfirmOpen}
      >
        {userName} will be able to manage every user, role and invite.
      </ConfirmDialog>
    </div>
  );
}
