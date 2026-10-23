"use client";

import type { RemoveGuestInput } from "@/api/small-groups-api/types";

import { useState } from "react";
import { UserMinusIcon } from "@heroicons/react/24/outline";
import { AlertDialog, Button } from "@heroui/react";
import { useTranslations } from "next-intl";

type Reason = NonNullable<RemoveGuestInput["leftReason"]>;

const REASONS: Reason[] = ["stopped_coming", "other"];

function RemoveGuestForm({
  name,
  initialReason,
  note,
  onConfirm,
}: {
  name: string;
  initialReason: Reason | null;
  /** Replaces the default "they leave today" line (the report form leaves from the meeting). */
  note?: string;
  onConfirm: (reason: Reason) => void;
}) {
  const t = useTranslations("RemoveGuestDialog");
  const [reason, setReason] = useState<Reason | null>(initialReason);

  return (
    <>
      <AlertDialog.Header>
        <AlertDialog.Icon status="danger">
          <UserMinusIcon aria-hidden="true" className="size-5" />
        </AlertDialog.Icon>
        <AlertDialog.Heading>{t("title", { name })}</AlertDialog.Heading>
      </AlertDialog.Header>
      <AlertDialog.Body>
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
          <legend className="mb-1 p-0 text-[13px] font-semibold text-heading">
            {t("reasonLegend")}
          </legend>
          {REASONS.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-heading has-[:focus-visible]:rounded-md has-[:focus-visible]:shadow-[var(--shadow-focus)]"
            >
              <input
                checked={reason === option}
                className="size-4 accent-[var(--accent)]"
                name="leftReason"
                type="radio"
                onChange={() => setReason(option)}
              />
              {t(`reasons.${option}`)}
            </label>
          ))}
        </fieldset>
        <p className="mt-4 text-sm text-muted">{note ?? t("note")}</p>
      </AlertDialog.Body>
      <AlertDialog.Footer>
        <Button className="font-semibold" slot="close" variant="outline">
          {t("cancel")}
        </Button>
        <Button
          className="font-semibold"
          isDisabled={reason === null}
          variant="danger"
          onPress={() => reason && onConfirm(reason)}
        >
          {t("confirm")}
        </Button>
      </AlertDialog.Footer>
    </>
  );
}

/**
 * Asks why a guest is leaving (stopped coming / other). *Mark as stopped coming* opens it with
 * that reason picked. The caller makes the call in `onConfirm`; the form remounts on every open.
 */
export function RemoveGuestDialog({
  target,
  initialReason = null,
  note,
  onOpenChange,
  onConfirm,
}: {
  target: { id: number; name: string } | null;
  /** Null asks without a default: the button stays off until one is picked. */
  initialReason?: Reason | null;
  note?: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (guest: { id: number; name: string }, reason: Reason) => void;
}) {
  return (
    <AlertDialog.Backdrop
      isKeyboardDismissDisabled={false}
      isOpen={target !== null}
      onOpenChange={onOpenChange}
    >
      <AlertDialog.Container placement="auto" size="sm">
        <AlertDialog.Dialog>
          {target && (
            <RemoveGuestForm
              initialReason={initialReason}
              name={target.name}
              note={note}
              onConfirm={(reason) => {
                onOpenChange(false);
                onConfirm(target, reason);
              }}
            />
          )}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
