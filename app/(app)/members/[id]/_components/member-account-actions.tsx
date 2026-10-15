"use client";

import type { MemberAccount } from "@/app/(app)/members/_lib/load-member-account";
import type { LinkableUser } from "@/app/(app)/members/_actions/account-actions";

import { useState, useTransition } from "react";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { InviteUserDialog } from "./invite-user-dialog";
import { LinkUserDialog } from "./link-user-dialog";

import {
  cancelMemberInviteAction,
  listLinkableUsersAction,
  unlinkMemberUserAction,
} from "@/app/(app)/members/_actions/account-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SavedToast } from "@/components/saved-toast";

type Overlay = "link" | "invite" | "unlink" | "cancel" | null;

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "danger";
}

interface LinkableState {
  users: LinkableUser[];
  suggestedIds: string[];
}

// The buttons of the Account card and the dialogs they open. Every change goes through a server
// action that revalidates the page, so the card re-renders into its new state; this only owns
// which dialog is open and the toast.
export function MemberAccountActions({
  member,
  account,
}: {
  member: { id: number; name: string; email: string | null };
  account: Pick<MemberAccount, "status" | "inviteToken" | "invitedEmail"> & {
    userName: string | null;
    /** A user already signs in with the member's email: Link is then the primary action. */
    hasSuggestedUser: boolean;
  };
}) {
  const t = useTranslations("MemberAccountActions");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [linkable, setLinkable] = useState<LinkableState | null>(null);
  const [linkableError, setLinkableError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { status } = account;

  function showToast(message: string, tone: ToastState["tone"] = "success") {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message, tone }));
  }

  // The user list is loaded when the dialog opens, and again each time: someone may have been
  // linked or invited since.
  function openLink() {
    setOverlay("link");
    setLinkableError(null);
    void listLinkableUsersAction(member.id).then((result) => {
      if (result.ok) setLinkable(result);
      else setLinkableError(result.error);
    });
  }

  function closeLink(isOpen: boolean) {
    if (isOpen) return;

    setOverlay(null);
    setLinkable(null);
  }

  function run(
    action: () => ReturnType<typeof unlinkMemberUserAction>,
    success: string,
  ) {
    startTransition(async () => {
      const result = await action();

      showToast(
        result.ok ? success : result.error,
        result.ok ? "success" : "danger",
      );
    });
  }

  const canInvite = !!member.email;
  const linkFirst = account.hasSuggestedUser;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status === "none" && (
        <>
          <Button
            className={clsx("font-semibold", linkFirst && "order-2")}
            isDisabled={!canInvite}
            variant={linkFirst ? "outline" : "primary"}
            onPress={() => setOverlay("invite")}
          >
            {t("invite")}
          </Button>
          <Button
            className={clsx("font-semibold", linkFirst && "order-1")}
            variant={linkFirst ? "primary" : "outline"}
            onPress={openLink}
          >
            {t("link")}
          </Button>
          {!canInvite && (
            <p className="order-3 basis-full text-[13px] text-muted">
              {t("noEmailHint")}
            </p>
          )}
        </>
      )}

      {status === "invited" && (
        <>
          <Button
            className="font-semibold"
            isDisabled={!account.inviteToken}
            isPending={isPending}
            variant="outline"
            onPress={() => setOverlay("cancel")}
          >
            {t("cancelInvite")}
          </Button>
          <Button
            className="font-semibold"
            variant="outline"
            onPress={openLink}
          >
            {t("link")}
          </Button>
        </>
      )}

      {status === "linked" && (
        <Button
          className="font-semibold"
          isPending={isPending}
          variant="danger-soft"
          onPress={() => setOverlay("unlink")}
        >
          {t("unlink")}
        </Button>
      )}

      <LinkUserDialog
        isOpen={overlay === "link"}
        loadError={linkableError}
        memberId={member.id}
        memberName={member.name}
        suggestedIds={linkable?.suggestedIds ?? []}
        users={linkable?.users ?? null}
        onLinked={(name) => {
          closeLink(false);
          showToast(t("linkedToast", { name }));
        }}
        onOpenChange={closeLink}
      />

      <InviteUserDialog
        defaultEmail={member.email ?? ""}
        isOpen={overlay === "invite"}
        memberName={member.name}
        onLinkInstead={() => {
          setOverlay(null);
          openLink();
        }}
        onOpenChange={(isOpen) => !isOpen && setOverlay(null)}
        onSent={(email) => {
          setOverlay(null);
          showToast(t("inviteToast", { email }));
        }}
      />

      <ConfirmDialog
        confirmLabel={t("cancelInviteConfirm")}
        isOpen={overlay === "cancel"}
        title={t("cancelInviteTitle")}
        tone="danger"
        onConfirm={() =>
          run(
            () => cancelMemberInviteAction(account.inviteToken ?? ""),
            t("cancelInviteToast", { email: account.invitedEmail ?? "" }),
          )
        }
        onOpenChange={(isOpen) => !isOpen && setOverlay(null)}
      >
        {t("cancelInviteBody", { email: account.invitedEmail ?? "" })}
      </ConfirmDialog>

      <ConfirmDialog
        confirmLabel={t("unlinkConfirm")}
        isOpen={overlay === "unlink"}
        title={t("unlinkTitle")}
        tone="danger"
        onConfirm={() =>
          run(
            () => unlinkMemberUserAction(String(member.id)),
            t("unlinkToast", { name: member.name }),
          )
        }
        onOpenChange={(isOpen) => !isOpen && setOverlay(null)}
      >
        {t("unlinkBody", {
          member: member.name,
          user: account.userName ?? t("unknownUser"),
        })}
      </ConfirmDialog>

      {toast && (
        <SavedToast key={toast.id} message={toast.message} tone={toast.tone} />
      )}
    </div>
  );
}
