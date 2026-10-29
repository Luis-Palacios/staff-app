"use client";

import type { Locale } from "@/lib/locale-shared";

import { useState, useTransition } from "react";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  type MarkedWeek,
  WeekDialog,
  WeekDialogError,
  WeekDialogHeader,
  WeekDialogLine,
} from "./week-dialog";

import { undoNoMeetingWeekAction } from "@/app/(app)/_actions/no-meeting-week-actions";
import { showToast } from "@/components/toast-host";
import { formatCalendarRange } from "@/lib/format-date";

/**
 * **Undo** on the week banner and its confirm: deletes the no meetings still linked to the week.
 * After it: toast, refresh, focus on `focusAfter` (the week heading; the banner goes away). If
 * someone undid it already, the dialog says so and the page refreshes when it closes.
 */
export function UndoWeekButton({
  week,
  focusAfter,
  className,
}: {
  week: MarkedWeek;
  focusAfter: string;
  className?: string;
}) {
  const t = useTranslations("NoMeetingWeek");
  const tForm = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function change(isOpen: boolean) {
    setOpen(isOpen);
    setError(null);
    if (!isOpen && gone) router.refresh();
  }

  function undo() {
    setError(null);
    startTransition(async () => {
      const result = await undoNoMeetingWeekAction(week.id);

      if (result.ok) {
        setOpen(false);
        showToast(t("undoneToast"));
        router.refresh();

        // The banner, and this button with it, goes away once the refresh lands.
        window.setTimeout(() => {
          document.getElementById(focusAfter)?.focus();
        }, 600);

        return;
      }

      if (result.gone) setGone(true);
      setError(result.message);
    });
  }

  return (
    <>
      <Button
        aria-haspopup="dialog"
        className={className}
        variant="outline"
        onPress={() => setOpen(true)}
      >
        <ArrowUturnLeftIcon
          aria-hidden="true"
          className="size-4"
          strokeWidth={1.8}
        />
        {t("undo")}
      </Button>
      <WeekDialog isOpen={open} isPending={isPending} onOpenChange={change}>
        <WeekDialogHeader
          danger
          eyebrow={t("weekOfRange", {
            range: formatCalendarRange(week.weekStart, week.weekEnd, locale),
          })}
          icon={<ArrowUturnLeftIcon aria-hidden="true" className="size-5" />}
          title={t("undoTitle", { count: week.linkedCount })}
        >
          <WeekDialogLine>{t("undoBody")}</WeekDialogLine>
        </WeekDialogHeader>
        {error && (
          <Modal.Body className="overflow-visible p-1">
            <WeekDialogError message={error} />
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button
            className="font-semibold max-sm:flex-1"
            isDisabled={isPending}
            variant="outline"
            onPress={() => change(false)}
          >
            {tForm("cancel")}
          </Button>
          <Button
            className="font-semibold max-sm:flex-1"
            isPending={isPending}
            variant="danger"
            onPress={undo}
          >
            {t("undo")}
          </Button>
        </Modal.Footer>
      </WeekDialog>
    </>
  );
}
