"use client";

import type { Locale } from "@/lib/locale-shared";
import type { MarkWeekCounts } from "./mark-week-counts";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Button,
  Description,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";

import { markNoMeetingWeekAction } from "@/app/(app)/_actions/no-meeting-week-actions";
import { REASON_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { CalendarXIcon } from "@/components/icons";
import { formatCalendarRange } from "@/lib/format-date";

export interface MarkWeekTarget {
  /** The week's Sunday and Saturday, "YYYY-MM-DD". */
  weekStart: string;
  weekEnd: string;
  counts: MarkWeekCounts;
  /**
   * Set when the week is already marked (a re-run, rule 6): its reason, null for none. The field
   * is left out and the existing reason is used.
   */
  existingReason?: string | null;
}

function CountLine({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <li
      className={clsx(
        "flex items-start gap-2.5 text-[14.5px] leading-normal",
        strong ? "font-semibold text-heading" : "text-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "mt-2 size-[7px] shrink-0 rounded-full border-[1.5px] border-current",
          strong && "bg-current",
        )}
      />
      <span>{text}</span>
    </li>
  );
}

function MarkWeekForm({
  target,
  isPending,
  startTransition,
  onDone,
  onClose,
}: {
  target: MarkWeekTarget;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onDone: (marked: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("NoMeetingWeek");
  const tForm = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const remaining = target.existingReason !== undefined;
  const { toMark, staying, noDay } = target.counts;

  // The form remounts on every open. The modal puts focus on the dialog itself, so move it to the
  // reason once that has happened (a re-run has no field and keeps the dialog's focus).
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => field.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await markNoMeetingWeekAction(target.weekStart, reason);

      if (result.ok) {
        onDone(result.marked);

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
            {remaining ? t("eyebrowRemaining") : t("eyebrowAll")}
          </p>
          <Modal.Heading className="font-display text-2xl font-medium text-heading">
            {remaining
              ? t("remainingTitle")
              : t("dialogTitle", {
                  range: formatCalendarRange(
                    target.weekStart,
                    target.weekEnd,
                    locale,
                  ),
                })}
          </Modal.Heading>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 font-normal">
          {toMark > 0 && (
            <CountLine strong text={t("toMark", { count: toMark })} />
          )}
          {staying > 0 && <CountLine text={t("staying", { count: staying })} />}
          {noDay > 0 && <CountLine text={t("noDay", { count: noDay })} />}
        </ul>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-3 overflow-visible p-1">
        {remaining ? (
          <div className="flex flex-col gap-1.5 rounded-xl bg-accent-soft px-3.5 py-3 text-accent-soft-foreground">
            <p className="text-[13.5px]">{t("usesReason")}</p>
            <p className="font-display text-base italic">
              {t("quoted", { reason: target.existingReason || t("noReason") })}
            </p>
          </div>
        ) : (
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
              <span className="font-normal text-muted">
                {tForm("optional")}
              </span>
            </Label>
            <TextArea
              ref={field}
              className="text-sm"
              placeholder={t("reasonPlaceholder")}
              rows={3}
            />
            <div className="flex items-start justify-between gap-3">
              <Description className="text-[13px] text-muted">
                {t("reasonHint")}
              </Description>
              <span className="shrink-0 text-[13px] text-muted tabular-nums">
                {tForm("reasonCounter", { count: reason.length })}
              </span>
            </div>
          </TextField>
        )}
        {error && (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="font-semibold max-sm:flex-1"
          isDisabled={isPending}
          variant="outline"
          onPress={onClose}
        >
          {tForm("cancel")}
        </Button>
        <Button
          className="font-semibold max-sm:flex-1"
          isPending={isPending}
          onPress={save}
        >
          {t("confirm", { count: toMark })}
        </Button>
      </Modal.Footer>
    </>
  );
}

/**
 * Marks a whole week as no meeting for every group still empty in it (church-wide no meeting).
 * Controlled: the caller opens it and hears `onDone` with what the API marked. A failure keeps
 * it open with the message; while saving it can't be closed.
 */
export function MarkWeekDialog({
  isOpen,
  target,
  onOpenChange,
  onDone,
}: {
  isOpen: boolean;
  target: MarkWeekTarget;
  onOpenChange: (isOpen: boolean) => void;
  onDone: (marked: number) => void;
}) {
  const [isPending, startTransition] = useTransition();

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
        <Modal.Dialog className="sm:max-w-[500px]">
          <MarkWeekForm
            isPending={isPending}
            startTransition={startTransition}
            target={target}
            onClose={() => onOpenChange(false)}
            onDone={(marked) => {
              onOpenChange(false);
              onDone(marked);
            }}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
