"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { deleteCareLogAction } from "@/app/(app)/_actions/care-log-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { showToast } from "@/components/toast-host";

/**
 * *Delete* for the entry's author (rule 10): a confirm first, then back to the care calendar. The
 * entry is soft-deleted, so its page answers not-found from then on (rule 57).
 */
export function DeleteEntryButton({
  entryId,
  ariaLabel,
}: {
  entryId: number;
  ariaLabel: string;
}) {
  const t = useTranslations("CareLog.entry");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // The dialog closes on confirm while the delete is still in flight: keep the button off till then.
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteCareLogAction(entryId);

      if (result.ok) {
        showToast(t("deleted"));
        router.replace("/care/calendar");
      } else {
        showToast(result.message, "danger");
      }
    });
  }

  return (
    <>
      <button
        aria-label={ariaLabel}
        className="min-h-11 text-[14.5px] font-semibold text-danger disabled:opacity-50"
        disabled={pending}
        type="button"
        onClick={() => setOpen(true)}
      >
        {t("delete")}
      </button>
      <ConfirmDialog
        confirmLabel={t("deleteConfirm")}
        icon={<TrashIcon aria-hidden="true" className="size-5" />}
        isOpen={open}
        title={t("deleteTitle")}
        tone="danger"
        onConfirm={remove}
        onOpenChange={setOpen}
      >
        {t("deleteBody")}
      </ConfirmDialog>
    </>
  );
}
