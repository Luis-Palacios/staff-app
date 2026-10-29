"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MarkWeekDialog, type MarkWeekTarget } from "./mark-week-dialog";

import { CalendarXIcon } from "@/components/icons";
import { showToast } from "@/components/toast-host";

const buttonClass = "h-11 gap-2 px-4 font-semibold max-sm:w-full";

/**
 * **Mark no meeting for all groups** (or **Mark the remaining groups** on a marked week) in the
 * week header, with its dialog, toast and refresh. Without a linked member it is disabled with
 * the reason under it, like New report (reports rule 5).
 */
export function MarkWeekButton({
  target,
  hasMember,
  focusAfter,
}: {
  target: MarkWeekTarget;
  hasMember: boolean;
  /** The id of the heading that takes focus once the week is marked. */
  focusAfter: string;
}) {
  const t = useTranslations("NoMeetingWeek");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const label =
    target.existingReason === undefined ? t("markAll") : t("markRemaining");
  const icon = <CalendarXIcon className="size-[18px]" />;

  function done(marked: number) {
    showToast(t("markedToast", { count: marked }));
    router.refresh();

    // The button goes away (or turns into "Mark the remaining groups") once the refresh lands.
    window.setTimeout(() => {
      document.getElementById(focusAfter)?.focus();
    }, 600);
  }

  if (!hasMember) {
    return (
      <div className="flex max-w-[280px] flex-col items-start gap-1.5 max-sm:max-w-none max-sm:basis-full">
        <Button
          isDisabled
          aria-describedby="mark-week-reason"
          className={buttonClass}
          variant="outline"
        >
          {icon}
          {label}
        </Button>
        <p
          className="text-[13px] leading-snug text-muted"
          id="mark-week-reason"
        >
          {t("needsMember")}
        </p>
      </div>
    );
  }

  return (
    <>
      <Button
        aria-haspopup="dialog"
        className={buttonClass}
        variant="outline"
        onPress={() => setOpen(true)}
      >
        {icon}
        {label}
      </Button>
      <MarkWeekDialog
        isOpen={open}
        target={target}
        onDone={done}
        onOpenChange={setOpen}
      />
    </>
  );
}
