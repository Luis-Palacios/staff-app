"use client";

import type { LinkableMember } from "@/app/(app)/members/_actions/account-actions";

import { useState, useTransition } from "react";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { LinkMemberDialog } from "./link-member-dialog";

import {
  listLinkableMembersAction,
  unlinkMemberUserAction,
} from "@/app/(app)/members/_actions/account-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SavedToast } from "@/components/saved-toast";

type Overlay = "link" | "unlink" | null;

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "danger";
}

interface LinkableState {
  members: LinkableMember[];
  suggestedIds: number[];
}

// The buttons of the Linked member card and the dialogs they open. Every change goes through a
// server action that revalidates the page, so the card re-renders into its new state; this only
// owns which dialog is open and the toast.
export function UserMemberActions({
  user,
  member,
}: {
  user: { id: string; name: string; email: string };
  member: { id: number; name: string } | null;
}) {
  const t = useTranslations("UserMemberActions");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [linkable, setLinkable] = useState<LinkableState | null>(null);
  const [linkableError, setLinkableError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
  }

  // Loaded each time the dialog opens: someone may have been linked since.
  function openLink() {
    setOverlay("link");
    setLinkableError(null);
    void listLinkableMembersAction(user.id).then((result) => {
      if (result.ok) setLinkable(result);
      else setLinkableError(result.error);
    });
  }

  function closeLink(isOpen: boolean) {
    if (isOpen) return;

    setOverlay(null);
    setLinkable(null);
  }

  function unlink() {
    if (!member) return;

    startTransition(async () => {
      const result = await unlinkMemberUserAction(String(member.id));

      showToast(
        result.ok ? t("unlinkToast", { name: member.name }) : result.error,
        result.ok ? "success" : "danger",
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {member ? (
        <Button
          className="font-semibold"
          isPending={isPending}
          variant="danger-soft"
          onPress={() => setOverlay("unlink")}
        >
          {t("unlink")}
        </Button>
      ) : (
        <Button className="font-semibold" variant="outline" onPress={openLink}>
          {t("link")}
        </Button>
      )}

      <LinkMemberDialog
        isOpen={overlay === "link"}
        loadError={linkableError}
        members={linkable?.members ?? null}
        suggestedIds={linkable?.suggestedIds ?? []}
        userId={user.id}
        userName={user.name}
        onLinked={(name) => {
          closeLink(false);
          showToast(t("linkedToast", { name }));
        }}
        onOpenChange={closeLink}
      />

      <ConfirmDialog
        confirmLabel={t("unlinkConfirm")}
        isOpen={overlay === "unlink"}
        title={t("unlinkTitle", { name: member?.name ?? "" })}
        tone="danger"
        onConfirm={unlink}
        onOpenChange={(isOpen) => !isOpen && setOverlay(null)}
      >
        {t("unlinkBody", { id: String(member?.id ?? 0) })}
      </ConfirmDialog>

      {toast && (
        <SavedToast key={toast.id} message={toast.message} tone={toast.tone} />
      )}
    </div>
  );
}
