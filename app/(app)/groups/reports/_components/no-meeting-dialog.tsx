"use client";

import type { Locale } from "@/lib/locale-shared";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Button,
  Description,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import {
  markNoMeeting,
  updateNoMeetingReason,
} from "@/app/(app)/groups/reports/_actions/report-actions";
import { REASON_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { CalendarXIcon } from "@/components/icons";
import { formatCalendarWeekdayDate } from "@/lib/format-date";

/** `mark` records a date as no meeting; `edit` changes the reason of one already recorded. */
export type NoMeetingKind = "mark" | "edit";

export interface NoMeetingTarget {
  groupId: number;
  groupName: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** Only for `edit`: the no-meeting report to change. */
  reportId?: number;
  /** Only for `edit`: the reason to start from. */
  reason?: string | null;
}

function NoMeetingForm({
  kind,
  target,
  onDone,
  onClose,
}: {
  kind: NoMeetingKind;
  target: NoMeetingTarget;
  onDone: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("NoMeetingDialog");
  const tForm = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const [reason, setReason] = useState(target.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const field = useRef<HTMLTextAreaElement>(null);
  const edit = kind === "edit";

  // The form remounts on every open. The modal puts focus on the dialog itself, so move it to the
  // reason once that has happened.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => field.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function save() {
    setError(null);
    startTransition(async () => {
      const result =
        edit && target.reportId !== undefined
          ? await updateNoMeetingReason(
              target.reportId,
              target.groupId,
              target.date,
              reason,
            )
          : await markNoMeeting(target.groupId, target.date, reason);

      if (result.ok) {
        onDone();

        return;
      }

      setError(result.message);
    });
  }

  return (
    <>
      <Modal.Header className="flex-col items-start gap-3">
        <Modal.Icon className="bg-default text-foreground">
          <CalendarXIcon className="size-5" />
        </Modal.Icon>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {target.groupName}
          </p>
          <Modal.Heading className="font-display text-2xl font-medium text-heading">
            {edit
              ? t("editTitle")
              : t("title", {
                  date: formatCalendarWeekdayDate(target.date, locale),
                })}
          </Modal.Heading>
        </div>
        <p className="text-sm font-normal text-muted">
          {edit ? t("editBody") : t("body")}
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-3 overflow-visible p-1">
        <TextField
          className="gap-1.5"
          isDisabled={isPending}
          maxLength={REASON_MAX}
          name="reason"
          value={reason}
          onChange={setReason}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {tForm("reasonLabel")}{" "}
            <span className="font-normal text-muted">{tForm("optional")}</span>
          </Label>
          <TextArea ref={field} className="text-sm" rows={3} />
          <div className="flex items-start justify-between gap-3">
            <Description className="text-[13px] text-muted">
              {t("reasonHint")}
            </Description>
            <span className="shrink-0 text-[13px] text-muted tabular-nums">
              {tForm("reasonCounter", { count: reason.length })}
            </span>
          </div>
        </TextField>
        {error && (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="font-semibold"
          isDisabled={isPending}
          variant="outline"
          onPress={onClose}
        >
          {tForm("cancel")}
        </Button>
        <Button className="font-semibold" isPending={isPending} onPress={save}>
          {edit ? t("save") : t("mark")}
        </Button>
      </Modal.Footer>
    </>
  );
}

/**
 * Marks a date as no meeting (or edits the reason of one). Controlled: the caller opens it and
 * hears about success in `onDone`, which is where its toast and refresh go. A failed save keeps
 * the dialog open with the reason; Escape and Cancel close it.
 */
export function NoMeetingDialog({
  isOpen,
  kind,
  target,
  onOpenChange,
  onDone,
}: {
  isOpen: boolean;
  kind: NoMeetingKind;
  target: NoMeetingTarget;
  onOpenChange: (isOpen: boolean) => void;
  onDone: () => void;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog className="sm:max-w-[480px]">
          <NoMeetingForm
            kind={kind}
            target={target}
            onClose={() => onOpenChange(false)}
            onDone={() => {
              onOpenChange(false);
              onDone();
            }}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
