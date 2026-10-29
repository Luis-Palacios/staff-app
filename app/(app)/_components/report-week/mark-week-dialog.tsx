"use client";

import type { Locale } from "@/lib/locale-shared";
import type { MarkWeekCounts } from "./mark-week-counts";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Modal } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import {
  WeekDialog,
  WeekDialogError,
  WeekDialogHeader,
  WeekDialogLine,
  WeekReasonField,
} from "./week-dialog";

import { markNoMeetingWeekAction } from "@/app/(app)/_actions/no-meeting-week-actions";
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
      <WeekDialogHeader
        eyebrow={remaining ? t("eyebrowRemaining") : t("eyebrowAll")}
        icon={<CalendarXIcon className="size-5" />}
        title={
          remaining
            ? t("remainingTitle")
            : t("dialogTitle", {
                range: formatCalendarRange(
                  target.weekStart,
                  target.weekEnd,
                  locale,
                ),
              })
        }
      >
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {toMark > 0 && (
            <li>
              <WeekDialogLine dot strong>
                {t("toMark", { count: toMark })}
              </WeekDialogLine>
            </li>
          )}
          {staying > 0 && (
            <li>
              <WeekDialogLine dot>
                {t("staying", { count: staying })}
              </WeekDialogLine>
            </li>
          )}
          {noDay > 0 && (
            <li>
              <WeekDialogLine dot>
                {t("noDay", { count: noDay })}
              </WeekDialogLine>
            </li>
          )}
        </ul>
      </WeekDialogHeader>
      <Modal.Body className="flex flex-col gap-3 overflow-visible p-1">
        {remaining ? (
          <div className="flex flex-col gap-1.5 rounded-xl bg-accent-soft px-3.5 py-3 text-accent-soft-foreground">
            <p className="text-[13.5px]">{t("usesReason")}</p>
            <p className="font-display text-base italic">
              {t("quoted", { reason: target.existingReason || t("noReason") })}
            </p>
          </div>
        ) : (
          <WeekReasonField
            fieldRef={field}
            isDisabled={isPending}
            value={reason}
            onChange={setReason}
          />
        )}
        <WeekDialogError message={error} />
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
    <WeekDialog
      isOpen={isOpen}
      isPending={isPending}
      onOpenChange={onOpenChange}
    >
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
    </WeekDialog>
  );
}
