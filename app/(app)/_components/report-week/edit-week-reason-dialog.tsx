"use client";

import type { Locale } from "@/lib/locale-shared";

import { useEffect, useRef, useState, useTransition } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  type MarkedWeek,
  WeekDialog,
  WeekDialogError,
  WeekDialogHeader,
  WeekDialogLine,
  WeekReasonField,
} from "./week-dialog";

import { updateNoMeetingWeekReasonAction } from "@/app/(app)/_actions/no-meeting-week-actions";
import { showToast } from "@/components/toast-host";
import { formatCalendarRange } from "@/lib/format-date";

function EditWeekReasonForm({
  week,
  isPending,
  startTransition,
  onGone,
  onDone,
  onClose,
}: {
  week: MarkedWeek;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onGone: () => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("NoMeetingWeek");
  const tForm = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const [reason, setReason] = useState(week.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  // The modal puts focus on the dialog itself; move it to the reason once that has happened.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => field.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateNoMeetingWeekReasonAction(week.id, reason);

      if (result.ok) {
        onDone();

        return;
      }

      if (result.gone) onGone();
      setError(result.message);
    });
  }

  return (
    <>
      <WeekDialogHeader
        eyebrow={t("weekOfRange", {
          range: formatCalendarRange(week.weekStart, week.weekEnd, locale),
        })}
        icon={<PencilIcon aria-hidden="true" className="size-5" />}
        title={t("editTitle")}
      >
        <WeekDialogLine>
          {t("editBody", { count: week.linkedCount })}
        </WeekDialogLine>
      </WeekDialogHeader>
      <Modal.Body className="flex flex-col gap-3 overflow-visible p-1">
        <WeekReasonField
          fieldRef={field}
          isDisabled={isPending}
          value={reason}
          onChange={setReason}
        />
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
          {t("save")}
        </Button>
      </Modal.Footer>
    </>
  );
}

/**
 * **Edit reason** on the week banner and its dialog. An emptied field saves as no reason. After a
 * save: toast, refresh, focus back on the button. If someone undid the week meanwhile, the
 * dialog says so and the page refreshes when it closes.
 */
export function EditWeekReasonButton({
  week,
  className,
}: {
  week: MarkedWeek;
  className?: string;
}) {
  const t = useTranslations("NoMeetingWeek");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const trigger = useRef<HTMLButtonElement>(null);

  function close(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen && gone) router.refresh();
  }

  function done() {
    setOpen(false);
    showToast(t("reasonUpdated"));
    router.refresh();
    window.setTimeout(() => trigger.current?.focus(), 0);
  }

  return (
    <>
      <Button
        ref={trigger}
        aria-haspopup="dialog"
        className={className}
        variant="outline"
        onPress={() => setOpen(true)}
      >
        <PencilIcon aria-hidden="true" className="size-4" strokeWidth={1.8} />
        {t("editReason")}
      </Button>
      <WeekDialog isOpen={open} isPending={isPending} onOpenChange={close}>
        <EditWeekReasonForm
          isPending={isPending}
          startTransition={startTransition}
          week={week}
          onClose={() => close(false)}
          onDone={done}
          onGone={() => setGone(true)}
        />
      </WeekDialog>
    </>
  );
}
