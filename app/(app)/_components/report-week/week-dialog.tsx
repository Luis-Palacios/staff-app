"use client";

import type { ReactNode, RefObject } from "react";

import { Description, Label, Modal, TextArea, TextField } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { REASON_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";

/**
 * The frame of the church-wide dialogs (mark, edit reason, undo): it can't be closed while a call
 * is running. The content remounts on every open.
 */
export function WeekDialog({
  isOpen,
  isPending,
  onOpenChange,
  children,
}: {
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: ReactNode;
}) {
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
        <Modal.Dialog className="sm:max-w-[500px]">{children}</Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** Icon tile, eyebrow and heading, then whatever explains the action (the `MarkWeekDialog` board). */
export function WeekDialogHeader({
  icon,
  danger,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode;
  /** Undo: the tile in the danger colors. */
  danger?: boolean;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <Modal.Header className="flex-col items-start gap-3">
      <Modal.Icon
        className={
          danger ? "bg-danger-soft text-danger" : "bg-default text-foreground"
        }
      >
        {icon}
      </Modal.Icon>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
          {eyebrow}
        </p>
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {title}
        </Modal.Heading>
      </div>
      {children}
    </Modal.Header>
  );
}

/** A line under the heading: the count lines of the mark dialog, the body of the others. */
export function WeekDialogLine({
  strong,
  dot,
  children,
}: {
  strong?: boolean;
  /** The count lines' dot: filled on the strong one. */
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={clsx(
        "flex items-start gap-2.5 text-[14.5px] leading-normal",
        strong ? "font-semibold text-heading" : "font-normal text-foreground",
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={clsx(
            "mt-2 size-[7px] shrink-0 rounded-full border-[1.5px] border-current",
            strong && "bg-current",
          )}
        />
      )}
      <span>{children}</span>
    </p>
  );
}

/** The optional reason with its hint and `n / 255` counter, as in `NoMeetingDialog`. */
export function WeekReasonField({
  value,
  isDisabled,
  fieldRef,
  onChange,
}: {
  value: string;
  isDisabled: boolean;
  fieldRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("NoMeetingWeek");
  const tForm = useTranslations("ReportForm");

  return (
    <TextField
      className="gap-1.5"
      isDisabled={isDisabled}
      maxLength={REASON_MAX}
      name="reason"
      value={value}
      onChange={onChange}
    >
      <Label className="text-[13px] font-semibold text-heading">
        {tForm("reasonLabel")}{" "}
        <span className="font-normal text-muted">{tForm("optional")}</span>
      </Label>
      <TextArea
        ref={fieldRef}
        className="text-sm"
        placeholder={t("reasonPlaceholder")}
        rows={3}
      />
      <div className="flex items-start justify-between gap-3">
        <Description className="text-[13px] text-muted">
          {t("reasonHint")}
        </Description>
        <span className="shrink-0 text-[13px] text-muted tabular-nums">
          {tForm("reasonCounter", { count: value.length })}
        </span>
      </div>
    </TextField>
  );
}

/** The error of a failed call, inside the dialog, which stays open. */
export function WeekDialogError({ message }: { message: string | null }) {
  return (
    message && (
      <p className="text-[13px] text-danger" role="alert">
        {message}
      </p>
    )
  );
}

/** A week marked church-wide, as the banner's actions need it. */
export interface MarkedWeek {
  id: number;
  /** The week's Sunday and Saturday, "YYYY-MM-DD". */
  weekStart: string;
  weekEnd: string;
  reason: string | null;
  /** Reports still linked to the week. */
  linkedCount: number;
}
