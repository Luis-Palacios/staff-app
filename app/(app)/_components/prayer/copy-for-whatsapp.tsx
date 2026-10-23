"use client";

import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";

import { showToast } from "@/components/toast-host";

/**
 * *Copy for WhatsApp*: puts `text` on the clipboard and says so in a toast (rules 12–13). Copy
 * only: no share sheet, no `wa.me` link. Focus stays on the button. Every string arrives
 * translated, so no client namespace is needed.
 */
export function CopyForWhatsApp({
  text,
  label,
  ariaLabel,
  copied,
  note,
  failed,
}: {
  text: string;
  label: string;
  /** Names the group when there are several buttons ("Copy for WhatsApp: Mujeres de Fe"). */
  ariaLabel?: string;
  /** The toast's title and second line on success, and the error toast. */
  copied: string;
  note: string;
  failed: string;
}) {
  async function copy() {
    try {
      // Missing outside a secure context; rejected when permission is denied.
      await navigator.clipboard.writeText(text);
      showToast(copied, "success", note);
    } catch {
      showToast(failed, "danger");
    }
  }

  return (
    <button
      aria-label={ariaLabel}
      className="inline-flex min-h-11 items-center gap-[7px] rounded-[10px] border border-border bg-surface px-3 text-[13.5px] font-semibold text-heading transition-colors hover:bg-default md:min-h-10"
      type="button"
      onClick={copy}
    >
      <DocumentDuplicateIcon
        aria-hidden="true"
        className="size-4 shrink-0"
        strokeWidth={1.7}
      />
      {label}
    </button>
  );
}
