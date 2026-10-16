"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Button, Description, Label, TextArea, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { REASON_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { card, title } from "@/components/primitives";

/**
 * Step 1 when the group didn't meet: an optional reason and the button that saves the date as a
 * no meeting (the address and the attendance choice are hidden above).
 */
export function NoMeetingCard({
  reason,
  date,
  saving,
  canSave,
  error,
  onReasonChange,
  onSave,
  onCancel,
}: {
  reason: string;
  /** "Thursday, Oct 1", for the note under the reason. */
  date: string;
  saving: boolean;
  /** False while the date already has a report or a no meeting. */
  canSave: boolean;
  /** A save that failed for a reason that doesn't belong on the date field. */
  error: string | null;
  onReasonChange: (reason: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("ReportForm");
  const router = useRouter();

  return (
    <section aria-labelledby="no-meeting-title" className={card({})}>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("noMeetingEyebrow")}
          </p>
          <h2
            className={title({ size: "sm", className: "text-[22px]" })}
            id="no-meeting-title"
          >
            {t("noMeetingTitle")}
          </h2>
        </div>

        <TextField
          className="gap-1.5"
          maxLength={REASON_MAX}
          name="reason"
          value={reason}
          onChange={onReasonChange}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("reasonLabel")}{" "}
            <span className="font-normal text-muted">{t("optional")}</span>
          </Label>
          <Description className="text-[13px] text-muted">
            {t("reasonHint")}
          </Description>
          <TextArea className="text-sm" rows={3} />
          <span className="self-end text-[13px] text-muted tabular-nums">
            {t("reasonCounter", { count: reason.length })}
          </span>
        </TextField>

        <p className="flex items-start gap-2 text-[13px] text-muted">
          <InformationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {t("noMeetingEffect", { date })}
        </p>

        {error && (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            className="w-full font-semibold sm:w-auto"
            isDisabled={saving}
            variant="outline"
            onPress={() => {
              onCancel();
              router.push("/groups/reports");
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            className="w-full font-semibold sm:w-auto"
            isDisabled={!canSave}
            isPending={saving}
            onPress={onSave}
          >
            {t("saveNoMeeting")}
          </Button>
        </div>
      </div>
    </section>
  );
}
