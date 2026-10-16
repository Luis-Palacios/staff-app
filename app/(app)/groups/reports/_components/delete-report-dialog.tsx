"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

import { deleteReportAction } from "@/app/(app)/groups/reports/_actions/report-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SavedToast } from "@/components/saved-toast";

// "Delete" in the header and its confirm. Success redirects to the list (`?saved=deleted`) from the
// action; a failure keeps the page and says why. Cancel and Escape return focus to the button.
// Labels arrive as props, so `ReportDetail` stays a server namespace.
export function DeleteReportDialog({
  reportId,
  groupId,
  labels,
}: {
  reportId: number;
  groupId: number;
  labels: { trigger: string; title: string; body: string; confirm: string };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [failure, setFailure] = useState<{ id: number; message: string }>();

  function remove() {
    startTransition(async () => {
      const result = await deleteReportAction(reportId, groupId);

      setFailure((current) => ({
        id: (current?.id ?? 0) + 1,
        message: result.message,
      }));
    });
  }

  return (
    <>
      <Button
        className="h-[42px] flex-1 gap-2 px-[18px] font-semibold text-danger sm:flex-none"
        isPending={isPending}
        variant="outline"
        onPress={() => setOpen(true)}
      >
        <TrashIcon
          aria-hidden="true"
          className="size-[18px]"
          strokeWidth={1.8}
        />
        {labels.trigger}
      </Button>
      <ConfirmDialog
        confirmLabel={labels.confirm}
        isOpen={open}
        title={labels.title}
        tone="danger"
        onConfirm={remove}
        onOpenChange={setOpen}
      >
        {labels.body}
      </ConfirmDialog>
      {failure && (
        <SavedToast key={failure.id} message={failure.message} tone="danger" />
      )}
    </>
  );
}
