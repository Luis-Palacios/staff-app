"use client";

import type { SubmitEvent } from "react";

import { useState } from "react";
import {
  ArrowUturnLeftIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button, Label, Modal, TextArea, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { reactivateGuestAction } from "@/app/(app)/guests/_actions/guest-actions";

const NOTE_MAX = 1000;

function ReactivateForm({
  guest,
  isPending,
  setIsPending,
  onClose,
  onDone,
}: {
  guest: { id: number; name: string };
  isPending: boolean;
  setIsPending: (isPending: boolean) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("ReactivateGuestDialog");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    setIsPending(true);
    setError(null);

    const result = await reactivateGuestAction(
      String(guest.id),
      note.trim() || null,
    );

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
          <p className="text-[13px] text-muted">{t("noteHint")}</p>
        </TextField>

        <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
          <InformationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-[18px] shrink-0"
            strokeWidth={1.8}
          />
          <span>{t("groupNotRestored")}</span>
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
        <Button className="font-semibold" isPending={isPending} type="submit">
          {t("submit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

// The banner's *Reactivate…* and its dialog. Success reloads with `?saved=reactivated`: the banner
// is gone once the guest is active, so it can't show the toast itself. The label comes from the
// server banner.
export function ReactivateGuestButton({
  label,
  guest,
}: {
  label: string;
  guest: { id: number; name: string };
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  return (
    <>
      <Button
        className="gap-2 font-semibold"
        variant="primary"
        onPress={() => setIsOpen(true)}
      >
        <ArrowUturnLeftIcon
          aria-hidden="true"
          className="size-4"
          strokeWidth={1.8}
        />
        {label}
      </Button>
      <Modal.Backdrop
        isDismissable={!isPending}
        isKeyboardDismissDisabled={isPending}
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!isPending) setIsOpen(open);
        }}
      >
        <Modal.Container placement="auto" scroll="inside" size="md">
          <Modal.Dialog className="sm:max-w-[520px]">
            <ReactivateForm
              guest={guest}
              isPending={isPending}
              setIsPending={setIsPending}
              onClose={() => setIsOpen(false)}
              onDone={() =>
                router.replace(`/guests/${guest.id}?saved=reactivated`)
              }
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
