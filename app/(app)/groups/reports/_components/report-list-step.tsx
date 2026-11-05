"use client";

import type {
  GroupAudience,
  ReportRosterPerson,
  ReportSectionKey,
} from "@/api/small-groups-api/types";
import type {
  DraftItem,
  DraftItems,
} from "@/app/(app)/groups/reports/_lib/report-items-draft";
import type { TagContext } from "@/app/(app)/groups/reports/_lib/report-tags";
import type { ReportDraftAnswer } from "@/app/(app)/groups/reports/_lib/report-form";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale-shared";

import { useState } from "react";
import {
  BuildingLibraryIcon,
  HandRaisedIcon,
  PencilSquareIcon,
  PlusIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Label, TextArea, TextField } from "@heroui/react";
import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";

import { ReportItemsFields } from "./report-items-field";
import {
  type ReportGuestControls,
  SomeoneNewButton,
  StoppedComingPanel,
  suggestsStopped,
} from "./report-guests";
import { YesNoButtons } from "./yes-no-buttons";

import {
  firstName,
  joinedRecently,
  MISSED_STREAK_MIN,
  personKey,
} from "@/app/(app)/groups/reports/_lib/person";
import { TEXT_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card, title } from "@/components/primitives";
import { formatCalendarShortDate } from "@/lib/format-date";

/**
 * Name, two Yes/No pairs and a note toggle per row (from `md`); the same row stacks below it.
 * The header and every row are separate grids, so the answer columns have a fixed width
 * (`--answer-col`, set on the card) to keep them lined up under their titles: the pair alone below
 * `xl`, the pair and its icon from `xl`.
 */
const rowGrid = (withNotes: boolean) =>
  clsx(
    "md:grid md:items-center md:gap-x-5",
    withNotes
      ? "md:grid-cols-[minmax(0,1fr)_var(--answer-col)_var(--answer-col)_128px]"
      : "md:grid-cols-[minmax(0,1fr)_var(--answer-col)_var(--answer-col)]",
  );

/**
 * The tint of the column header and block headings: `surface-secondary` at 50% over the card,
 * mixed into one opaque colour because both strips stick and the rows scroll underneath them.
 */
const stripBackground =
  "bg-[color-mix(in_oklab,var(--surface-secondary)_50%,var(--surface))]";

// The two questions, with the icons the report's summary tiles use for the same totals.
const MeetingIcon = UserGroupIcon;
const ChurchIcon = BuildingLibraryIcon;

export function isMarked(answer: ReportDraftAnswer | undefined) {
  return (
    answer !== undefined &&
    answer.attendedGroup !== null &&
    answer.attendedChurch !== null
  );
}

// One question in a row: its icon and title above the pair on a phone; from `md` the title is in
// the column header. From `xl` the icon also sits beside the pair so the two pairs never look
// alike; between `md` and `xl` there is no room for it without squeezing the names.
function AnswerColumn({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof HandRaisedIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted md:hidden">
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0"
          strokeWidth={1.8}
        />
        {title}
      </span>
      <div className="flex items-center gap-2">
        <Icon
          aria-hidden="true"
          className="hidden size-4 shrink-0 text-muted xl:block"
          strokeWidth={1.8}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

// A column title in the header; from `xl` its icon lines up with the icon beside each row's pair.
function ColumnTitle({
  icon: Icon,
  children,
}: {
  icon: typeof HandRaisedIcon;
  children: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Icon
        aria-hidden="true"
        className="hidden size-4 shrink-0 xl:block"
        strokeWidth={1.8}
      />
      <span className="truncate">{children}</span>
    </span>
  );
}

// The title strip of one block of a guest group's attendance: icon, name and how many. It sticks
// while its block scrolls past: under the top bar on a phone, under the column header from `md`.
function BlockHeading({
  id,
  icon: Icon,
  count,
  children,
}: {
  id: string;
  icon: typeof HandRaisedIcon;
  count: number;
  children: ReactNode;
}) {
  return (
    <h3
      className={clsx(
        "sticky top-(--topbar-height) z-10 flex items-center gap-2 border-y border-separator px-4 py-2.5 text-sm font-semibold text-heading first:border-t-0 sm:px-5",
        "md:top-[calc(var(--topbar-height)+var(--attendance-header-height))]",
        stripBackground,
      )}
      id={id}
    >
      <Icon
        aria-hidden="true"
        className="size-4 text-eyebrow"
        strokeWidth={1.8}
      />
      {children}
      <span className="font-normal text-muted tabular-nums">{count}</span>
    </h3>
  );
}

function PersonRow({
  person,
  meetingDate,
  shortSundayLabel,
  answer,
  observationsVisible,
  tintUnanswered,
  showOpen,
  noteOpen,
  focusNote,
  guests,
  onToggleNote,
  onChange,
}: {
  person: ReportRosterPerson;
  meetingDate: string;
  shortSundayLabel: string;
  answer: ReportDraftAnswer | undefined;
  observationsVisible: boolean;
  tintUnanswered: boolean;
  /** Say which answer is still missing when only one is (a resumed draft, auto-save rule 12). */
  showOpen: boolean;
  noteOpen: boolean;
  /** True when the user just opened this note, so focus moves into it. */
  focusNote: boolean;
  /** The guest controls of a guest group; null for a member group. */
  guests: ReportGuestControls | null;
  onToggleNote: () => void;
  onChange: (patch: Partial<ReportDraftAnswer>) => void;
}) {
  const t = useTranslations("ReportForm");
  const tRole = useTranslations("SmallGroupRole");
  const locale = useLocale() as Locale;
  const first = firstName(person.name);
  const observation = answer?.observation ?? "";
  const isGuest = person.person.type === "guest";
  const added = guests?.justAdded.has(personKey(person.person)) ?? false;
  // A guest at 3+ gets the suggestion panel instead of the hint (rule 12).
  const suggest = suggestsStopped(person.person, person.missedStreak);
  const missed = person.missedStreak >= MISSED_STREAK_MIN && !suggest;
  const joined = !missed && joinedRecently(person, meetingDate);
  const groupOpen = answer?.attendedGroup == null;
  const churchOpen = answer?.attendedChurch == null;
  // One of the two missing: say which, in place of the role (`Draft-Resume`).
  const openHint =
    showOpen && !added && groupOpen !== churchOpen
      ? groupOpen
        ? t("meetingOpen")
        : t("churchOpen")
      : null;
  const colChurch = t("colChurch", { sunday: shortSundayLabel });
  const noteLabel = noteOpen
    ? t("hideNote")
    : observation
      ? t("noteShort")
      : t("addNoteShort");

  return (
    <li
      className={clsx(
        "flex flex-col gap-3 px-4 py-3.5 sm:px-5",
        rowGrid(observationsVisible),
        added
          ? "bg-focus-row shadow-[inset_3px_0_0_var(--color-gold-500)]"
          : tintUnanswered && !isMarked(answer) && "bg-warning-soft/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <InitialsAvatar name={person.name} size="md" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-heading">
            {person.name}
          </span>
          <span
            className={clsx(
              "text-xs",
              missed || openHint
                ? "font-semibold text-warning-soft-foreground"
                : "text-muted",
            )}
          >
            {added
              ? t("addedJustNow")
              : openHint
                ? openHint
                : missed
                  ? t("missedStreak", { count: person.missedStreak })
                  : joined
                    ? t("joinedSince", {
                        date: formatCalendarShortDate(person.joinedAt, locale),
                      })
                    : isGuest
                      ? t("participant")
                      : tRole(person.role)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:contents">
        <AnswerColumn icon={MeetingIcon} title={t("colMeeting")}>
          <YesNoButtons
            label={`${first}: ${t("colMeeting")}`}
            noLabel={t("no")}
            size="compact"
            value={answer?.attendedGroup ?? null}
            yesLabel={t("yes")}
            onChange={(value) => onChange({ attendedGroup: value })}
          />
        </AnswerColumn>
        <AnswerColumn icon={ChurchIcon} title={colChurch}>
          <YesNoButtons
            label={`${first}: ${colChurch}`}
            noLabel={t("no")}
            size="compact"
            value={answer?.attendedChurch ?? null}
            yesLabel={t("yes")}
            onChange={(value) => onChange({ attendedChurch: value })}
          />
        </AnswerColumn>
      </div>

      {observationsVisible && (
        <button
          aria-expanded={noteOpen}
          aria-label={`${noteLabel}: ${first}`}
          className={clsx(
            "flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-control border px-3 text-sm font-semibold text-heading outline-none focus-visible:shadow-[var(--shadow-focus)]",
            observation
              ? "border-accent bg-accent-soft text-accent-soft-foreground"
              : "border-dashed border-field-border hover:border-accent",
          )}
          type="button"
          onClick={onToggleNote}
        >
          {observation ? (
            <PencilSquareIcon aria-hidden="true" className="size-4" />
          ) : (
            <PlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
          )}
          {noteLabel}
        </button>
      )}

      {observationsVisible && noteOpen && (
        <TextField
          className="gap-1.5 md:col-span-4"
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
          <p className="text-[13px] text-muted">{t("notePrivacy")}</p>
        </TextField>
      )}

      {guests && (
        <StoppedComingPanel
          className="md:col-span-full"
          controls={guests}
          missedStreak={person.missedStreak}
          person={person.person}
        />
      )}
    </li>
  );
}

/**
 * The full list: everyone on the roster with two Yes/No pairs and an optional note, then the three
 * group textareas, then the caller's footer. Review, the quick list and edit all use it.
 * `observationsVisible` false (rule 9) removes the note column and toggles entirely.
 */
export function ReportListStep({
  people,
  answers,
  meetingDate,
  shortSundayLabel,
  observationsVisible,
  tintUnanswered,
  showOpen = false,
  items,
  tagContext,
  audience,
  guests,
  onAnswer,
  onItems,
  footer,
}: {
  /** In display order: a guest group lists its guests first. */
  people: ReportRosterPerson[];
  answers: Record<string, ReportDraftAnswer>;
  meetingDate: string;
  /** The church Sunday for the column titles ("Sun, Oct 11"). */
  shortSundayLabel: string;
  observationsVisible: boolean;
  tintUnanswered: boolean;
  /** Say which answer is missing under a half-answered person's name. */
  showOpen?: boolean;
  items: DraftItems;
  tagContext: TagContext;
  /** A guest group splits the list into Guests and Leaders and members. */
  audience: GroupAudience;
  guests: ReportGuestControls | null;
  /** `key` is the person's `personKey`. */
  onAnswer: (key: string, patch: Partial<ReportDraftAnswer>) => void;
  onItems: (section: ReportSectionKey, items: DraftItem[]) => void;
  footer: ReactNode;
}) {
  const t = useTranslations("ReportForm");
  const [openNotes, setOpenNotes] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        people
          .map((person) => personKey(person.person))
          .filter((key) => answers[key]?.observation),
      ),
  );
  const [focused, setFocused] = useState<string | null>(null);
  const marked = people.filter((person) =>
    isMarked(answers[personKey(person.person)]),
  ).length;
  const guestRows = people.filter((person) => person.person.type === "guest");
  const otherRows = people.filter((person) => person.person.type !== "guest");

  function toggleNote(key: string) {
    setOpenNotes((current) => {
      const next = new Set(current);

      if (!next.delete(key)) {
        next.add(key);
        setFocused(key);
      }

      return next;
    });
  }

  const rows = (list: ReportRosterPerson[]) =>
    list.map((person) => {
      const key = personKey(person.person);

      return (
        <PersonRow
          key={key}
          answer={answers[key]}
          focusNote={focused === key}
          guests={guests}
          meetingDate={meetingDate}
          noteOpen={openNotes.has(key)}
          observationsVisible={observationsVisible}
          person={person}
          shortSundayLabel={shortSundayLabel}
          showOpen={showOpen}
          tintUnanswered={tintUnanswered}
          onChange={(patch) => onAnswer(key, patch)}
          onToggleNote={() => toggleNote(key)}
        />
      );
    });

  return (
    <div className="flex flex-col gap-5">
      {/* `overflow-clip`, not `overflow-hidden`: both round the corners, but `hidden` makes the
          card its own scroll box, and then the headers below would never stick to the page. */}
      <section
        aria-labelledby="attendance-title"
        className={card({
          className:
            "overflow-clip [--answer-col:146px] [--attendance-header-height:2.5rem] xl:[--answer-col:176px]",
        })}
      >
        <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-5 sm:px-5">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
              {t("attendanceEyebrow")}
            </p>
            <h2
              className={title({ size: "sm", className: "text-[22px]" })}
              id="attendance-title"
            >
              {t("attendanceTitle")}
            </h2>
          </div>
          <p className="text-[13px] text-muted" role="status">
            {t("marked", { count: marked, total: people.length })}
          </p>
        </div>
        {/* Sticks under the top bar so the two Yes/No columns stay named on a long list. Phones
            don't show it: each row titles its own pairs there. */}
        <div
          aria-hidden="true"
          className={clsx(
            "sticky top-(--topbar-height) z-20 hidden h-(--attendance-header-height) whitespace-nowrap border-y border-separator px-5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted",
            stripBackground,
            rowGrid(observationsVisible),
          )}
        >
          <span>{t("colMember")}</span>
          <ColumnTitle icon={MeetingIcon}>{t("colMeeting")}</ColumnTitle>
          <ColumnTitle icon={ChurchIcon}>
            {t("colChurch", { sunday: shortSundayLabel })}
          </ColumnTitle>
          <span>{observationsVisible ? t("colNote") : ""}</span>
        </div>
        {audience === "guests" ? (
          <>
            <section aria-labelledby="guests-block-title">
              <BlockHeading
                count={guestRows.length}
                icon={HandRaisedIcon}
                id="guests-block-title"
              >
                {t("guestsBlock")}
              </BlockHeading>
              {guestRows.length > 0 ? (
                <ul className="divide-y divide-separator">{rows(guestRows)}</ul>
              ) : (
                <p className="px-4 py-3.5 text-sm text-muted sm:px-5">
                  {t("noGuestsYet")}
                </p>
              )}
              {guests && (
                <SomeoneNewButton
                  className="border-t border-separator px-4 py-4 sm:px-5"
                  controls={guests}
                />
              )}
            </section>
            {otherRows.length > 0 && (
              <section aria-labelledby="members-block-title">
                <BlockHeading
                  count={otherRows.length}
                  icon={UsersIcon}
                  id="members-block-title"
                >
                  {t("membersBlock")}
                </BlockHeading>
                <ul className="divide-y divide-separator">{rows(otherRows)}</ul>
              </section>
            )}
          </>
        ) : (
          <ul className="divide-y divide-separator border-t border-separator md:border-t-0">
            {rows(people)}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="shared-title"
        className={card({ className: "p-5" })}
      >
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("groupEyebrow")}
          </p>
          <h2
            className={title({ size: "sm", className: "text-[22px]" })}
            id="shared-title"
          >
            {t("groupTitle")}
          </h2>
        </div>
        <ReportItemsFields
          items={items}
          tagContext={tagContext}
          onChange={onItems}
        />
      </section>

      <div
        className={card({
          className:
            "flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5",
        })}
      >
        {footer}
      </div>
    </div>
  );
}
