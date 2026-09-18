"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { authClient } from "@/lib/auth/auth-client";

export function CancelInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setIsSubmitting(true);
    setError(null);

    const { error: cancelError } = await authClient.invite.cancel({ token });

    if (cancelError) {
      setError(cancelError.message ?? "Failed to cancel invite");
      setIsSubmitting(false);

      return;
    }

    // Left true deliberately, same as AssignPendingRole: the row's status flips away from
    // "pending" once router.refresh()'s fresh data lands, so there's no success state to reset.
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        isPending={isSubmitting}
        size="sm"
        variant="danger-soft"
        onPress={handleCancel}
      >
        Cancel
      </Button>

      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
