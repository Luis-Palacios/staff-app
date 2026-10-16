"use client";

import type { ReportRosterPerson } from "@/api/small-groups-api/types";
import type { ReportDraftAnswer } from "@/app/(app)/groups/reports/_lib/report-draft";
import type { Locale } from "@/lib/locale-shared";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Button, Label, TextArea, TextField } from "@heroui/react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";

import { YesNoButtons } from "./yes-no-buttons";

import {
  firstName,
  joinedRecently,
  MISSED_STREAK_MIN,
} from "@/app/(app)/groups/reports/_lib/person";
import { TEXT_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatCalendarShortDate } from "@/lib/format-date";

/**
 * One person at a time: a card with the name, two Yes/No questions and an optional note. There is
 * no auto-advance, so the note isn't skipped; **Next person** waits for both answers (rule 3).
 * Focus lands on the name each time the person changes.
 */
export function PersonStep({
  person,
  index,
  total,
  meetingDate,
  sundayLabel,
  answer,
  onChange,
  onBack,
  onNext,
  onSkip,
}: {
  person: ReportRosterPerson;
  index: number;
  total: number;
  meetingDate: string;
  sundayLabel: string;
  answer: ReportDraftAnswer | undefined;
  onChange: (patch: Partial<ReportDraftAnswer>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("ReportForm");
  const tRole = useTranslations("SmallGroupRole");
  const locale = useLocale() as Locale;
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [focusNote, setFocusNote] = useState(false);
  const first = firstName(person.name);
  const attendedGroup = answer?.attendedGroup ?? null;
  const attendedChurch = answer?.attendedChurch ?? null;
  const observation = answer?.observation ?? "";
  const answered = attendedGroup !== null && attendedChurch !== null;
  const isLast = index === total - 1;
  const missed = person.missedStreak >= MISSED_STREAK_MIN;
  const joined = !missed && joinedRecently(person, meetingDate);

  // A new person: focus the name, and show the note box only if there already is a note.
  useEffect(() => {
    nameRef.current?.focus();
    setNoteOpen(observation.length > 0);
    setFocusNote(false);
    // Only when the person changes, not on each keystroke in the note.
  }, [person.memberId]);

  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="font-semibold text-heading">
          {t("personCount", { n: index + 1, total })}
        </span>
        <button
          className="font-semibold text-link underline decoration-gold-500 underline-offset-4"
          type="button"
          onClick={onSkip}
        >
          {t("skipToList")}
        </button>
      </div>
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: total }, (_, position) => (
          <span
            key={position}
            className={clsx(
              "h-1 flex-1 rounded-full",
              position < index
                ? "bg-accent"
                : position === index
                  ? "bg-focus"
                  : "bg-border",
            )}
          />
        ))}
      </div>

      <section
        aria-labelledby="person-name"
        className={card({ className: "overflow-hidden" })}
      >
        <div className="flex flex-col items-center gap-2.5 px-5 pb-6 pt-7 text-center">
          <InitialsAvatar
            className="!size-[76px] !text-2xl"
            name={person.name}
          />
          <h2
            ref={nameRef}
            className="font-display text-[26px] font-medium leading-tight tracking-[-0.01em] text-heading outline-none"
            id="person-name"
            tabIndex={-1}
          >
            {person.name}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <StatusBadge
              tone={person.role === "member" ? "neutral" : "accent"}
              variant="ring-dot"
            >
              {tRole(person.role)}
            </StatusBadge>
            {missed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-0.5 text-[12.5px] font-semibold text-warning-soft-foreground">
                <ExclamationTriangleIcon
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={2}
                />
                {t("missedStreak", { count: person.missedStreak })}
              </span>
            )}
            {joined && (
              <span className="rounded-full bg-default px-2.5 py-0.5 text-[12.5px] font-semibold text-muted">
                {t("joinedSince", {
                  date: formatCalendarShortDate(person.joinedAt, locale),
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-separator px-5 py-5">
          <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[15px] font-semibold text-heading">
              {t("q1", { name: first })}
            </legend>
            <YesNoButtons
              label={t("q1", { name: first })}
              noLabel={t("no")}
              size="large"
              value={attendedGroup}
              yesLabel={t("yesCame")}
              onChange={(value) => onChange({ attendedGroup: value })}
            />
          </fieldset>
          <fieldset className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 text-[15px] font-semibold text-heading">
              {t("q2", { name: first, sunday: sundayLabel })}
            </legend>
            <YesNoButtons
              label={t("q2", { name: first, sunday: sundayLabel })}
              noLabel={t("no")}
              size="large"
              value={attendedChurch}
              yesLabel={t("yesChurch")}
              onChange={(value) => onChange({ attendedChurch: value })}
            />
          </fieldset>

          {noteOpen ? (
            <TextField
              className="gap-1.5"
              maxLength={TEXT_MAX}
              value={observation}
              onChange={(value) => onChange({ observation: value })}
            >
              <Label className="text-[13px] font-semibold text-heading">
                {t("noteLabel", { name: first })}
              </Label>
              {/* Opened by the user's own press, so moving focus into it is what they expect. */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <TextArea autoFocus={focusNote} className="text-sm" rows={3} />
              <p className="flex items-center gap-1.5 text-[13px] text-muted">
                <LockClosedIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
                {t("notePrivacy")}
              </p>
            </TextField>
          ) : (
            <button
              className="flex h-11 items-center gap-2 rounded-control border border-dashed border-field-border px-4 text-sm font-semibold text-heading hover:border-accent"
              type="button"
              onClick={() => {
                setFocusNote(true);
                setNoteOpen(true);
              }}
            >
              <PlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
              {t("addNote", { name: first })}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-separator bg-surface-secondary/50 px-5 py-4">
          <Button
            className="gap-2 font-semibold"
            variant="outline"
            onPress={onBack}
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
            {t("back")}
          </Button>
          <Button
            className="gap-2 font-semibold"
            isDisabled={!answered}
            onPress={onNext}
          >
            {isLast ? t("continue") : t("nextPerson")}
            <ArrowRightIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
          </Button>
        </div>
      </section>
      {!answered && (
        <p className="text-center text-[13px] text-muted">{t("answerBoth")}</p>
      )}
    </div>
  );
}
