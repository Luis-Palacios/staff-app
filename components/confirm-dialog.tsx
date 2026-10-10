"use client";

import type { ReactNode } from "react";

import { AlertDialog, Button } from "@heroui/react";

// Controlled yes/no dialog for actions that need a second look (granting
// Admin). The caller opens it from its own handler, so it only appears when
// the action needs confirming. Escape and Cancel close it without acting.
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  children,
  confirmLabel,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Backdrop
      isKeyboardDismissDisabled={false}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <AlertDialog.Container size="sm">
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Icon status="warning" />
            <AlertDialog.Heading>{title}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p className="text-sm text-muted">{children}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button
              className="rounded-control font-semibold"
              slot="close"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="rounded-control font-semibold"
              onPress={() => {
                onOpenChange(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
