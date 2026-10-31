"use client";

import type { GuestInactiveReason } from "@/api/guests-api/types";
import type { SubmitEvent } from "react";

import { useState } from "react";
import {
  ExclamationCircleIcon,
  EyeSlashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import { useTranslations } from "next-intl";

import { GuestDatePicker } from "@/app/(app)/groups/[id]/_components/guest-date-picker";
import { deactivateGuestAction } from "@/app/(app)/guests/_actions/guest-actions";

const INACTIVE_REASONS: readonly GuestInactiveReason[] = [
  "moved_away",
  "stopped_attending",
  "joined_another_church",
  "deceased",
  "other",
];

const NOTE_MAX = 1000;

function DeactivateForm({
  guest,
  groupName,
  today,
  isPending,
  setIsPending,
  onClose,
  onDone,
}: {
  guest: { id: number; name: string };
  groupName: string | null;
  today: string;
  isPending: boolean;
  setIsPending: (isPending: boolean) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("DeactivateGuestDialog");
  const tReason = useTranslations("GuestInactiveReason");
  const [reason, setReason] = useState<GuestInactiveReason | null>(null);
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason || isPending) return;

    setIsPending(true);
    setError(null);

    const result = await deactivateGuestAction(String(guest.id), {
      reason,
      effectiveDate: date,
      note: note.trim() || null,
    });

    if (!result.ok) {
      setIsPending(false);
      setError(result.error);

      return;
    }

    onDone();
  }

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("title", { name: guest.name })}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">{t("description")}</p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        <div className="flex flex-wrap items-start gap-3.5">
          <Select.Root
            // eslint-disable-next-line jsx-a11y/no-autofocus -- focus starts on the first field of the dialog
            autoFocus
            isRequired
            aria-label={t("reason")}
            className="flex-[1_1_240px] gap-1.5"
            isDisabled={isPending}
            placeholder={t("reasonPlaceholder")}
            selectedKey={reason}
            onSelectionChange={(key) => setReason(key as GuestInactiveReason)}
          >
            <Label className="text-[13px] font-semibold text-heading">
              {t("reason")}
            </Label>
            <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {INACTIVE_REASONS.map((option) => (
                  <ListBox.Item key={option} id={option}>
                    {tReason(option)}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select.Root>

          <div className="flex-[1_1_180px]">
            <GuestDatePicker
              isDisabled={isPending}
              label={t("date")}
              max={today}
              note={t("dateHint")}
              value={date}
              onChange={setDate}
            />
          </div>
        </div>

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
          <TextArea className="text-sm" rows={3} />
          <p className="text-[13px] text-muted">{t("noteHint")}</p>
        </TextField>

        <div className="flex flex-col gap-3 rounded-xl border border-separator bg-surface-secondary px-4 py-3.5">
          <p className="text-[13px] font-semibold text-heading">
            {t("whatHappens")}
          </p>
          <ul className="flex flex-col gap-3">
            {groupName && (
              <li className="flex items-start gap-2.5 text-sm">
                <UserGroupIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted"
                  strokeWidth={1.8}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold text-heading">
                    {t("leavesGroup", { group: groupName })}
                  </span>
                  <span className="text-muted">{t("leavesGroupBody")}</span>
                </span>
              </li>
            )}
            <li className="flex items-start gap-2.5 text-sm">
              <EyeSlashIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted"
                strokeWidth={1.8}
              />
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold text-heading">
                  {t("movesToInactive")}
                </span>
                <span className="text-muted">{t("movesToInactiveBody")}</span>
              </span>
            </li>
          </ul>
        </div>

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
          isDisabled={!reason}
          isPending={isPending}
          type="submit"
          variant="danger"
        >
          {t("submit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

/**
 * Marks a guest inactive: reason, the date they left (today or earlier) and a note, then what will
 * happen. Nothing can close it while the call is in flight. Remounts on every open.
 */
export function DeactivateGuestDialog({
  isOpen,
  onOpenChange,
  ...form
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  guest: { id: number; name: string };
  groupName: string | null;
  /** Today at the church ("YYYY-MM-DD"): the latest date they can have left. */
  today: string;
  onDone: () => void;
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
      <Modal.Container placement="auto" scroll="inside" size="md">
        <Modal.Dialog className="sm:max-w-[560px]">
          <DeactivateForm
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
