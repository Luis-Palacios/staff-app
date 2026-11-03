"use client";

import type { Locale } from "@/lib/locale-shared";

import { CalendarDaysIcon, UserIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";

import { card, textLink, title } from "@/components/primitives";
import { formatCalendarFullDate } from "@/lib/format-date";

/** Who started the draft and when, formatted on the server in the church's time zone. */
export interface ResumeInfo {
  startedBy: string;
  startedDate: string;
  startedTime: string;
  savedTime: string;
  /** The group's other leaders and co-leaders (and the starter), who can continue it too. */
  others: string[];
}

/**
 * On top of a draft's list when it is opened again (`Draft-Resume`, auto-save rule 12): who started
 * it, its progress (one segment per person), **Continue one at a time** from the first person with
 * an answer missing, and the date and place with **Change date or place**.
 */
export function ResumeCard({
  info,
  answered,
  done,
  firstOpenName,
  date,
  address,
  onContinue,
  onChangeMeeting,
}: {
  info: ResumeInfo;
  answered: number;
  /** Per person, in list order: both answers given. */
  done: boolean[];
  /** Null once everyone is answered. */
  firstOpenName: string | null;
  date: string;
  address: string;
  onContinue: () => void;
  onChangeMeeting: () => void;
}) {
  const t = useTranslations("ReportForm");
  const locale = useLocale() as Locale;
  const total = done.length;
  const left = total - answered;

  return (
    <section
      aria-labelledby="resume-title"
      className={card({ className: "overflow-hidden" })}
    >
      <div className="flex flex-col gap-4 px-4 py-[18px] sm:px-6 sm:py-[22px]">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("resumeEyebrow")}
          </p>
          <h2
            className={title({ size: "sm", className: "text-2xl" })}
            id="resume-title"
          >
            {t("resumeTitle")}
          </h2>
          <p className="mt-1 text-sm leading-normal text-muted">
            {t("resumeBy", {
              name: info.startedBy,
              date: info.startedDate,
              time: info.startedTime,
              saved: info.savedTime,
            })}
            {info.others.length > 0 && (
              <>
                {" "}
                {t("resumeOthers", {
                  names: new Intl.ListFormat(locale, {
                    type: "conjunction",
                  }).format(info.others),
                  count: info.others.length,
                })}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-muted tabular-nums">
            <span>
              <strong className="font-semibold text-heading">{answered}</strong>{" "}
              {t("resumeAnswered", { total })}
            </span>
            <span
              className={clsx(
                "font-semibold",
                left > 0
                  ? "text-warning-soft-foreground"
                  : "text-success-soft-foreground",
              )}
            >
              {left > 0
                ? t("resumeLeft", { count: left })
                : t("resumeAllAnswered")}
            </span>
          </p>
          <div
            aria-label={t("resumeProgress")}
            aria-valuemax={total}
            aria-valuemin={0}
            aria-valuenow={answered}
            className="flex gap-1"
            role="progressbar"
          >
            {done.map((isDone, index) => (
              <span
                // The segments only stand for positions in the list.

                key={index}
                className={clsx(
                  "h-1.5 min-w-0 flex-1 rounded-full",
                  isDone ? "bg-accent" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <Button
            className="h-12 w-full gap-2 px-5 font-semibold sm:w-auto"
            onPress={onContinue}
          >
            <UserIcon
              aria-hidden="true"
              className="size-[18px]"
              strokeWidth={1.8}
            />
            {firstOpenName ? t("continueGuided") : t("reviewGuided")}
          </Button>
          <p className="min-w-0 flex-[1_1_220px] text-[13.5px] leading-snug text-muted">
            {firstOpenName
              ? t("continueHint", { name: firstOpenName })
              : t("reviewHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 border-t border-border bg-surface-secondary/50 px-4 py-3.5 text-sm sm:px-6">
        <span className="inline-flex items-center gap-2 font-semibold text-heading">
          <CalendarDaysIcon
            aria-hidden="true"
            className="size-4 text-muted"
            strokeWidth={1.7}
          />
          {formatCalendarFullDate(date, locale)}
        </span>
        {address && (
          <span className="min-w-0 flex-[1_1_200px] text-muted">{address}</span>
        )}
        <button
          className={textLink({
            className:
              "min-h-8 text-sm outline-none focus-visible:shadow-[var(--shadow-focus)]",
          })}
          type="button"
          onClick={onChangeMeeting}
        >
          {t("changeMeeting")}
        </button>
      </div>
    </section>
  );
}
