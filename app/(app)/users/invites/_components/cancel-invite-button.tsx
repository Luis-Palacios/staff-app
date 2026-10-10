"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { smallOutlineButton } from "@/components/data-table";
import { authClient } from "@/lib/auth/auth-client";

// Danger outline: the outline button with danger text, border and hover.
const dangerOutline = [
  smallOutlineButton,
  "border-danger/40 text-danger [--button-bg-hover:var(--danger-soft)] [--button-bg-pressed:var(--danger-soft)]",
].join(" ");

export function CancelInviteButton({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
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
    <div className="flex flex-col items-end gap-1">
      <Button
        aria-label={`Cancel invite for ${email}`}
        className={dangerOutline}
        isPending={isSubmitting}
        size="sm"
        variant="outline"
        onPress={handleCancel}
      >
        Cancel
      </Button>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
