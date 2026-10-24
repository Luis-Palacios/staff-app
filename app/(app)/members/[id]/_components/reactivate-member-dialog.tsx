"use client";

import type { AuthRole } from "@/lib/auth/roles";
import type { SubmitEvent } from "react";

import { useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Checkbox,
  Description,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import { useTranslations } from "next-intl";

import { reactivateMemberAction } from "@/app/(app)/members/_actions/status-actions";
import { authClient } from "@/lib/auth/auth-client";
import { MEMBER_INACTIVE_BAN_REASON } from "@/lib/members/inactive";

const NOTE_MAX = 1000;

/** The linked user, when there is one and sign-in is off. Absent: no checkbox. */
export interface ReactivateSignIn {
  userId: string;
  email: string;
  role: AuthRole;
  /** Their ban reason; only ours (rule 10) is lifted. */
  banReason: string | null;
}

export interface ReactivateOutcome {
  /** Reactivated, but the unban failed. */
  unbanFailed: boolean;
}

function ReactivateForm({
  member,
  signIn,
  isPending,
  setIsPending,
  onClose,
  onDone,
}: {
  member: { id: number; name: string };
  signIn: ReactivateSignIn | null;
  isPending: boolean;
  setIsPending: (isPending: boolean) => void;
  onClose: () => void;
  onDone: (outcome: ReactivateOutcome) => void;
}) {
  const t = useTranslations("ReactivateMemberDialog");
  const tRoles = useTranslations("Roles");
  // Rule 10: a ban we didn't put there is left alone.
  const ours = signIn?.banReason === MEMBER_INACTIVE_BAN_REASON;
  const [note, setNote] = useState("");
  const [turnOn, setTurnOn] = useState(ours);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    setIsPending(true);
    setError(null);

    const result = await reactivateMemberAction(
      String(member.id),
      note.trim() || null,
    );

    if (!result.ok) {
      setIsPending(false);
      setError(result.error);

      return;
    }

    let unbanFailed = false;

    if (signIn && ours && turnOn) {
      const { error: unbanError } = await authClient.admin.unbanUser({
        userId: signIn.userId,
      });

      unbanFailed = !!unbanError;
    }

    onDone({ unbanFailed });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("title", { name: member.name })}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">{t("description")}</p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        <TextField
          fullWidth
          className="gap-1.5"
          isDisabled={isPending}
          maxLength={NOTE_MAX}
          value={note}
          onChange={setNote}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("note")}
          </Label>
          <TextArea
            // eslint-disable-next-line jsx-a11y/no-autofocus -- focus starts on the first field of the dialog
            autoFocus
            className="text-sm"
            placeholder={t("notePlaceholder")}
            rows={3}
          />
        </TextField>

        {signIn && (
          <Checkbox
            className="data-[disabled=true]:opacity-100 [&[data-disabled=true]_[data-slot=checkbox-control]]:opacity-(--disabled-opacity)"
            id="turn-sign-in-on"
            isDisabled={isPending || !ours}
            isSelected={turnOn}
            onChange={setTurnOn}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label
                className="text-[13px] font-semibold text-heading"
                htmlFor="turn-sign-in-on"
              >
                {t("signInBack")}
              </Label>
            </Checkbox.Content>
            <Description className="text-[13px] text-muted">
              {ours
                ? t("signInBackBody", {
                    email: signIn.email,
                    role: tRoles(signIn.role),
                  })
                : t("bannedOther")}
            </Description>
          </Checkbox>
        )}

        <p className="text-sm text-muted">{t("groupsNotRestored")}</p>

        {error && (
          <div
            className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground"
            role="alert"
          >
            <ExclamationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="font-semibold"
          isDisabled={isPending}
          type="button"
          variant="outline"
          onPress={onClose}
        >
          {t("cancel")}
        </Button>
        <Button className="font-semibold" isPending={isPending} type="submit">
          {t("submit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

/** Reactivates an inactive member; groups are not restored. Remounts on every open. */
export function ReactivateMemberDialog({
  isOpen,
  onOpenChange,
  ...form
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  member: { id: number; name: string };
  signIn: ReactivateSignIn | null;
  onDone: (outcome: ReactivateOutcome) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Modal.Backdrop
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <Modal.Container placement="auto" size="md">
        <Modal.Dialog className="sm:max-w-[480px]">
          <ReactivateForm
            {...form}
            isPending={isPending}
            setIsPending={setIsPending}
            onClose={() => onOpenChange(false)}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
