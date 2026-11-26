"use client";

import type { CareLogEntry } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  ArrowRightIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AddToCalendar } from "./add-to-calendar";
import { CareKindIcon } from "./care-kind-icon";
import { PanelNotes } from "./care-notes";
import { useEntryMeta } from "./use-entry-meta";

import { StatusBadge } from "@/components/status-badge";
import { SourceLine } from "@/components/report-timeline/timeline-care-row";
import {
  canRecordNow,
  careTitleKey,
  formatCareWhen,
} from "@/lib/care-log-format";
import { formatList, formatListParts } from "@/lib/format-list";
import { canAddToCalendar } from "@/lib/care-calendar-event";
import { personHref } from "@/lib/person-href";
import { firstNameOf } from "@/lib/report-items";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * An entry on the care calendar (rule 54): the entry as the timeline row shows it, in a dialog from
 * `md` up and a bottom sheet below, with *Record how it went*, *Add to calendar* and *Edit* when
 * they apply, and *Open page* (rule 56). The two form actions are the calendar's to open, since the
 * form takes the panel's place.
 */
export function CareCalendarPanel({
  entry,
  today,
  viewerMemberId,
  canWrite,
  onClose,
  onRecord,
  onEdit,
}: {
  entry: CareLogEntry | null;
  today: string;
  viewerMemberId: number | null;
  /** `careLog: create`. */
  canWrite: boolean;
  onClose: () => void;
  onRecord: (entry: CareLogEntry) => void;
  onEdit: (entry: CareLogEntry) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Modal.Backdrop
      isOpen={entry !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <Modal.Container
        className={isDesktop ? undefined : "p-0 sm:w-full sm:p-0"}
        placement={isDesktop ? "center" : "bottom"}
        size="md"
      >
        <Modal.Dialog
          className={clsx(
            "flex max-h-[calc(100dvh-1.5rem)] flex-col gap-0 overflow-hidden p-0",
            isDesktop
              ? "sm:max-w-[560px]"
              : "max-w-none rounded-b-none rounded-t-panel",
          )}
        >
          {entry && (
            <PanelBody
              canWrite={canWrite}
              entry={entry}
              isDesktop={isDesktop}
              today={today}
              viewerMemberId={viewerMemberId}
              onClose={onClose}
              onEdit={onEdit}
              onRecord={onRecord}
            />
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PanelBody({
  entry,
  today,
  viewerMemberId,
  canWrite,
  isDesktop,
  onClose,
  onRecord,
  onEdit,
}: {
  entry: CareLogEntry;
  today: string;
  viewerMemberId: number | null;
  canWrite: boolean;
  isDesktop: boolean;
  onClose: () => void;
  onRecord: (entry: CareLogEntry) => void;
  onEdit: (entry: CareLogEntry) => void;
}) {
  const t = useTranslations("CareLog");
  const c = useTranslations("CareCalendar");
  const locale = useLocale() as Locale;
  const planned = entry.status === "planned";
  const title = t(careTitleKey(entry));
  const when = formatCareWhen(entry, locale);
  const meta = useEntryMeta(viewerMemberId)(entry);
  const names = entry.people.map((person) => {
    const id = person.memberId ?? person.guestId;

    return {
      name: person.name,
      href:
        person.viewable && id !== null
          ? personHref({
              type: person.memberId !== null ? "member" : "guest",
              id,
            })
          : null,
    };
  });
  const visibility =
    entry.visibility === "private"
      ? entry.participants.length > 0
        ? t("entry.visibleWith", {
            names: formatList(
              entry.participants.map((p) => p.name),
              locale,
            ),
          })
        : t("visiblePrivate")
      : entry.people.length === 1
        ? t("visibleLeaders", { name: firstNameOf(entry.people[0].name) })
        : t("entry.visibleLeadersMany");
  const record = canWrite && canRecordNow(entry, today);
  const edit = entry.canEdit && entry.status !== "cancelled";
  const calendar = canAddToCalendar(entry);
  const tone = entry.pastDue
    ? "bg-warning-soft text-warning-soft-foreground"
    : planned
      ? "bg-default text-muted"
      : entry.kind === "heard"
        ? "bg-default text-muted"
        : "bg-accent-soft text-accent-soft-foreground";

  return (
    <>
      {!isDesktop && (
        <span
          aria-hidden="true"
          className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-field-border"
        />
      )}
      <div className="flex shrink-0 items-start gap-3.5 px-[18px] pb-1 pt-3.5 md:px-6 md:pt-[22px]">
        <span
          aria-hidden="true"
          className={clsx(
            "flex size-10 shrink-0 items-center justify-center rounded-[11px]",
            tone,
          )}
        >
          <CareKindIcon className="size-5" kind={entry.kind} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Modal.Heading className="font-display text-[26px] font-medium leading-[1.15] text-heading">
              {title}
            </Modal.Heading>
            {planned && (
              <StatusBadge
                tone={entry.pastDue ? "warning" : "neutral"}
                variant={entry.pastDue ? "solid-dot" : "ring-dot"}
              >
                {entry.pastDue ? t("badgePastDue") : t("badgePlanned")}
              </StatusBadge>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-heading">
            <CalendarDaysIcon
              aria-hidden="true"
              className="size-[15px] text-muted"
              strokeWidth={1.8}
            />
            {when}
          </span>
        </div>
        <button
          aria-label={c("close")}
          className="-mr-2.5 -mt-1.5 flex size-11 shrink-0 items-center justify-center rounded-[10px] text-heading"
          type="button"
          onClick={onClose}
        >
          <XMarkIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-[18px] pb-5 pt-2 md:px-6 md:pb-[22px]">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px]">
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted">
            {t("about")}
          </span>
          {/* One inline span: the flex gap only separates the label from the list, never commas. */}
          <span>
            {formatListParts(
              names.map((person) => person.name),
              locale,
            ).map((part, position) => {
              if (part.type === "literal") {
                return (
                  <Fragment key={position}>
                    {part.value.trim() ? part.value : null}
                  </Fragment>
                );
              }

              const href = names[part.index].href;

              return href ? (
                <NextLink
                  key={position}
                  className="font-semibold text-link underline decoration-gold-500 underline-offset-[3px]"
                  href={href}
                >
                  {part.value}
                </NextLink>
              ) : (
                <span key={position} className="font-semibold text-heading">
                  {part.value}
                </span>
              );
            })}
          </span>
        </p>
        <p className="text-[13.5px] text-muted">{meta}</p>
        {entry.text && (
          <p className="whitespace-pre-line text-pretty break-words text-[15px] leading-[1.55] text-foreground">
            {entry.text}
          </p>
        )}
        <PanelNotes
          canAddNote={entry.canAddNote}
          entryId={entry.id}
          notes={entry.notes}
          viewerMemberId={viewerMemberId}
        />
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-subtle">
          <span className="inline-flex items-center gap-1 font-medium">
            <LockClosedIcon
              aria-hidden="true"
              className="size-3 shrink-0"
              strokeWidth={1.8}
            />
            {visibility}
          </span>
          {entry.source && <SourceLine source={entry.source} />}
          <NextLink
            className="inline-flex min-h-11 items-center gap-[5px] text-[13.5px] font-semibold text-link underline decoration-gold-500 underline-offset-[3px]"
            href={`/care-log/${entry.id}`}
            prefetch={false}
          >
            {c("openPage")}
            <ArrowRightIcon
              aria-hidden="true"
              className="size-[13px]"
              strokeWidth={2}
            />
          </NextLink>
        </p>
      </div>

      {(record || calendar || edit) && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-3.5 gap-y-2.5 border-t border-border bg-surface-secondary px-[18px] py-3.5 md:rounded-b-[16px] md:px-6">
          {record && (
            <Button
              className="h-11 px-4 text-[14.5px] font-semibold max-md:w-full"
              variant="primary"
              onPress={() => onRecord(entry)}
            >
              {t("record")}
            </Button>
          )}
          {calendar && (
            <AddToCalendar
              className="h-11! max-md:w-full"
              entry={entry}
              placement="top start"
            />
          )}
          {edit && (
            <button
              aria-label={t("editAria", { title, date: when })}
              className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-heading underline decoration-gold-500 underline-offset-4"
              type="button"
              onClick={() => onEdit(entry)}
            >
              {t("edit")}
            </button>
          )}
        </div>
      )}
    </>
  );
}
