"use client";

import type { SubmitEvent } from "react";

import { useState, useTransition } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button, Input, Label, ListBox, Modal, Select } from "@heroui/react";
import { useTranslations } from "next-intl";

import { inviteMemberAction } from "@/app/(app)/members/_actions/account-actions";
import { AUTH_ROLES, AuthRole } from "@/lib/auth/roles";

// Nobody is invited straight into pending (same filter as the Users page invite form).
const ASSIGNABLE_ROLES = AUTH_ROLES.filter((role) => role !== AuthRole.Pending);

function InviteUserForm({
  defaultEmail,
  memberName,
  onSent,
  onLinkInstead,
  onClose,
}: {
  defaultEmail: string;
  memberName: string;
  onSent: (email: string) => void;
  onLinkInstead: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("MemberAccountActions");
  const tRoles = useTranslations("Roles");
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(defaultEmail);
  const [role, setRole] = useState<AuthRole>(AuthRole.User);
  const [error, setError] = useState<string | null>(null);
  const [userExists, setUserExists] = useState(false);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const address = email.trim();

    if (!address) return;

    setError(null);
    setUserExists(false);
    startTransition(async () => {
      const result = await inviteMemberAction(address, role);

      if (result.ok) onSent(address);
      else if (result.code === "userExists") setUserExists(true);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("inviteTitle")}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">
          {t("inviteSubtitle", { name: memberName })}
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        <div className="flex flex-col gap-1.5">
          <Label
            className="text-[13px] font-semibold text-heading"
            htmlFor="invite-email"
          >
            {t("emailLabel")}
          </Label>
          <Input
            autoComplete="off"
            disabled={isPending}
            id="invite-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setUserExists(false);
            }}
          />
          <p className="text-[13px] text-muted">{t("emailHint")}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Select.Root
            className="w-full gap-1.5"
            isDisabled={isPending}
            selectedKey={role}
            onSelectionChange={(key) => key && setRole(key as AuthRole)}
          >
            <Label className="text-[13px] font-semibold text-heading">
              {t("roleLabel")}
            </Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {ASSIGNABLE_ROLES.map((r) => (
                  <ListBox.Item key={r} id={r}>
                    {tRoles(r)}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select.Root>
          <p className="text-[13px] text-muted">{t("roleHint")}</p>
        </div>

        <p className="text-[13px] text-muted">{t("autoLinkNote")}</p>

        {userExists && (
          <div
            className="flex flex-col items-start gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground"
            role="alert"
          >
            <span>{t("userExists")}</span>
            <Button
              className="font-semibold"
              size="sm"
              type="button"
              variant="outline"
              onPress={onLinkInstead}
            >
              {t("link")}
            </Button>
          </div>
        )}

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
        <Button
          className="font-semibold"
          isDisabled={!email.trim() || userExists}
          isPending={isPending}
          type="submit"
        >
          {t("inviteSubmit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

export function InviteUserDialog({
  isOpen,
  onOpenChange,
  defaultEmail,
  memberName,
  onSent,
  onLinkInstead,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  defaultEmail: string;
  memberName: string;
  onSent: (email: string) => void;
  onLinkInstead: () => void;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog className="sm:max-w-[520px]">
          <InviteUserForm
            defaultEmail={defaultEmail}
            memberName={memberName}
            onClose={() => onOpenChange(false)}
            onLinkInstead={onLinkInstead}
            onSent={onSent}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
