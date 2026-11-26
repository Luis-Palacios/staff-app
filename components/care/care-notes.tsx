"use client";

import type { CareLogNote } from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  ChatBubbleLeftEllipsisIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import NextLink from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { churchDateIn } from "@/lib/care-log-format";
import { useChurchTimeZone } from "@/lib/contexts/user-context";
import { formatCalendarShortDate } from "@/lib/format-date";

/** The writer's name ("Ana Pérez (you)") and the date line ("Oct 12 · edited") of a note. */
export function useNoteLabels(viewerMemberId: number | null) {
  const t = useTranslations("CareLog");
  const locale = useLocale() as Locale;
  const timeZone = useChurchTimeZone();

  return {
    name: (note: CareLogNote) =>
      note.author.memberId === viewerMemberId
        ? t("entry.you", { name: note.author.name })
        : note.author.name,
    meta: (note: CareLogNote) => {
      const date = formatCalendarShortDate(
        churchDateIn(note.createdAt, timeZone),
        locale,
      );

      return note.editedAt ? t("notes.edited", { date }) : date;
    },
  };
}

/**
 * A note's text, 4 lines then *Show more* (rule 62). The button shows only when the text is
 * really cut off, which is measured (and again when the width changes) while it is folded.
 */
export function ClampedNoteText({ text }: { text: string }) {
  const t = useTranslations("CareLog.notes");
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [cutOff, setCutOff] = useState(false);
  const id = useId();

  useEffect(() => {
    const element = ref.current;

    if (!element || expanded) return;

    const measure = () =>
      setCutOff(element.scrollHeight > element.clientHeight + 1);

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <>
      <p
        ref={ref}
        className={clsx(
          "whitespace-pre-line text-pretty break-words text-[14.5px] leading-[1.55] text-foreground",
          !expanded && "line-clamp-4",
        )}
        id={id}
      >
        {text}
      </p>
      {(cutOff || expanded) && (
        <button
          aria-controls={id}
          aria-expanded={expanded}
          className="min-h-8 self-start text-[13.5px] font-semibold text-link underline decoration-gold-500 underline-offset-[3px]"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t("showLess") : t("showMore")}
        </button>
      )}
    </>
  );
}

/** The notes as the timeline and the calendar panel draw them: a rail, the writer, 4 lines. */
function CompactNoteList({
  notes,
  viewerMemberId,
}: {
  notes: CareLogNote[];
  viewerMemberId: number | null;
}) {
  const labels = useNoteLabels(viewerMemberId);

  return (
    <ul className="flex flex-col gap-2.5">
      {notes.map((note) => (
        <li
          key={note.id}
          className="flex flex-col gap-0.5 border-l-2 border-border pl-3"
        >
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[13.5px] font-semibold text-heading">
              {labels.name(note)}
            </span>
            <span className="text-[12.5px] text-subtle">
              {labels.meta(note)}
            </span>
          </span>
          <ClampedNoteText text={note.text} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Under a timeline row's summary: "2 notes from those who took part", folded, opening in place
 * (rule 62). It is folded again whenever the page loads.
 */
export function TimelineNotes({
  notes,
  viewerMemberId,
}: {
  notes: CareLogNote[];
  viewerMemberId: number | null;
}) {
  const t = useTranslations("CareLog.notes");
  const [open, setOpen] = useState(false);
  const listId = useId();

  if (notes.length === 0) return null;

  const Chevron = open ? ChevronUpIcon : ChevronDownIcon;

  return (
    <div className="mt-0.5 flex flex-col gap-2">
      <button
        aria-controls={listId}
        aria-expanded={open}
        className={clsx(
          "inline-flex min-h-9 items-center gap-[7px] self-start rounded-full border border-border py-0 pl-2.5 pr-3 text-[13.5px] font-semibold text-heading",
          open ? "bg-default" : "bg-surface",
        )}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <ChatBubbleLeftEllipsisIcon
          aria-hidden="true"
          className="size-[15px]"
          strokeWidth={1.8}
        />
        {t("toggle", { count: notes.length })}
        <Chevron
          aria-hidden="true"
          className="size-[13px] text-muted"
          strokeWidth={2}
        />
      </button>
      <div hidden={!open} id={listId}>
        {open && (
          <CompactNoteList notes={notes} viewerMemberId={viewerMemberId} />
        )}
      </div>
    </div>
  );
}

/**
 * In the calendar panel: the notes open, with *Add your note* opening the entry's page with its
 * form open (one form, not a second one here).
 */
export function PanelNotes({
  entryId,
  notes,
  canAddNote,
  viewerMemberId,
}: {
  entryId: number;
  notes: CareLogNote[];
  canAddNote: boolean;
  viewerMemberId: number | null;
}) {
  const t = useTranslations("CareLog.notes");

  if (notes.length === 0 && !canAddNote) return null;

  return (
    <section
      aria-labelledby="cce-notes"
      className="flex flex-col gap-2.5 border-t border-border pt-3"
    >
      <h3
        className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted"
        id="cce-notes"
      >
        {t("head")}
      </h3>
      {notes.length > 0 && (
        <CompactNoteList notes={notes} viewerMemberId={viewerMemberId} />
      )}
      {canAddNote && (
        <NextLink
          className="inline-flex h-11 items-center gap-[7px] self-start rounded-[10px] border border-field-border bg-surface px-3.5 text-sm font-semibold text-heading"
          href={`/care-log/${entryId}?note=add`}
          prefetch={false}
        >
          <PlusIcon aria-hidden="true" className="size-4" strokeWidth={1.8} />
          {t("add")}
        </NextLink>
      )}
    </section>
  );
}
