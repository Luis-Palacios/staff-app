"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button, Input, Label, ListBox, Modal, Select } from "@heroui/react";
import { useTranslations } from "next-intl";

const EXPIRY_DAYS = [1, 7, 30] as const;
const NO_EXPIRY = "none";

export interface BanInput {
  reason: string | undefined;
  /** Days until the ban ends; `undefined` is until unbanned. */
  days: number | undefined;
}

function BanUserForm({
  userName,
  isPending,
  error,
  onSubmit,
  onClose,
}: {
  userName: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (input: BanInput) => void;
  onClose: () => void;
}) {
  const t = useTranslations("UserAccountActions");
  const [reason, setReason] = useState("");
  const [expiry, setExpiry] = useState<string>(NO_EXPIRY);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      reason: reason.trim() || undefined,
      days: expiry === NO_EXPIRY ? undefined : Number(expiry),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("banTitle", { name: userName })}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">{t("banBody")}</p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        <div className="flex flex-col gap-1.5">
          <Label
            className="text-[13px] font-semibold text-heading"
            htmlFor="ban-reason"
          >
            {t("reasonLabel")}
          </Label>
          <Input
            autoComplete="off"
            id="ban-reason"
            maxLength={200}
            placeholder={t("reasonPlaceholder")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <Select.Root
          aria-label={t("expiryLabel")}
          isDisabled={isPending}
          selectedKey={expiry}
          onSelectionChange={(key) => setExpiry(String(key))}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("expiryLabel")}
          </Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id={NO_EXPIRY}>{t("expiryNone")}</ListBox.Item>
              {EXPIRY_DAYS.map((days) => (
                <ListBox.Item key={days} id={String(days)}>
                  {t("expiryDays", { count: days })}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select.Root>

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
          isPending={isPending}
          type="submit"
          variant="danger"
        >
          {t("banSubmit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

// The form remounts on every open, so it always starts with no reason and no expiry.
export function BanUserDialog({
  isOpen,
  onOpenChange,
  ...form
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userName: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (input: BanInput) => void;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog className="sm:max-w-[480px]">
          <BanUserForm {...form} onClose={() => onOpenChange(false)} />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
