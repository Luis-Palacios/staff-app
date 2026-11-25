"use client";

import type {
  CareLogAudience,
  CareLogCreateInput,
  CareLogEntry,
  CareLogKind,
  CareLogMeetingMode,
  CareLogPersonInput,
  CareLogSourceInput,
  CareLogUpdateInput,
  CareLogVisibility,
} from "@/api/care-log-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { RefObject } from "react";
import type { CareLogFailureCode } from "@/app/(app)/_actions/care-log-actions";
import type { PickerOption } from "./care-picker-panel";

import {
  CalendarIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Description,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CareDatePicker } from "./care-date-picker";
import { CareKindIcon } from "./care-kind-icon";
import { CarePickerPanel } from "./care-picker-panel";

import {
  cancelCareLogAction,
  checkCareLogAudienceAction,
  completeCareLogAction,
  createCareLogAction,
  listCareLogParticipantOptionsAction,
  searchCareLogPeopleAction,
  updateCareLogAction,
} from "@/app/(app)/_actions/care-log-actions";
import { formatCalendarShortWeekdayDate } from "@/lib/format-date";
import { normalizeText } from "@/lib/normalize-text";
import { firstNameOf } from "@/lib/report-items";
import { useMediaQuery } from "@/lib/use-media-query";

const KINDS: CareLogKind[] = [
  "call",
  "message",
  "meeting",
  "visit",
  "heard",
  "note",
];
const PLANNABLE: readonly CareLogKind[] = ["call", "meeting", "visit"];
const MAX_PEOPLE = 10;
const MAX_TEXT = 4000;
const SEARCH_DELAY_MS = 250;
const AUDIENCE_DELAY_MS = 400;

/** A person the entry is about, as the picker and the chips hold them. */
export interface CareLogPerson {
  type: "member" | "guest";
  id: number;
  name: string;
}

/** Where the entry comes from (rule 12): the API's source and how the *From* card reads. */
export interface CareLogSourceInfo {
  input: CareLogSourceInput;
  /** Already translated: "Conversation about Lucía · Jóvenes Bello Horizonte, Thu, Sep 24". */
  label: string;
  /** Opens the source for whoever can see it. */
  href?: string;
  icon: "report" | "conversation";
}

export type CareLogFormMode =
  | { type: "new" }
  | { type: "edit"; entry: CareLogEntry }
  | { type: "complete"; entry: CareLogEntry };

export type CareLogSaved =
  | "logged"
  | "planned"
  | "updated"
  | "completed"
  | "cancelled";

type Field =
  | "kind"
  | "mode"
  | "heard"
  | "date"
  | "people"
  | "others"
  | "participants"
  | "text"
  | "visibility";

/** The field an API error code belongs under; the rest go to the banner. */
const FIELD_OF: Partial<Record<CareLogFailureCode, Field>> = {
  kind_status: "kind",
  kind: "kind",
  status: "kind",
  date: "date",
  text: "text",
  others: "others",
  heard_from: "heard",
  meeting_mode: "mode",
  people: "people",
  participants: "participants",
  visibility: "visibility",
};

function personKey(person: Pick<CareLogPerson, "type" | "id">): string {
  return `${person.type}:${person.id}`;
}

function toPersonInput(person: CareLogPerson): CareLogPersonInput {
  return person.type === "guest"
    ? { guestId: person.id }
    : { memberId: person.id };
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value) => b.includes(value));

/**
 * What differs between the entry and the form's values, for a PATCH. A kind change sends the kind's
 * own fields together (meeting mode, who told us), since the API validates them as a set.
 */
function changedFields(
  entry: CareLogEntry,
  body: Omit<CareLogCreateInput, "status" | "source">,
): CareLogUpdateInput {
  const changes: CareLogUpdateInput = {};
  const kindChanged = body.kind !== entry.kind;

  if (kindChanged) changes.kind = body.kind;

  if (kindChanged || body.meetingMode !== entry.meetingMode) {
    changes.meetingMode = body.meetingMode;
  }

  if (kindChanged || body.heardFrom !== entry.heardFrom) {
    changes.heardFrom = body.heardFrom;
  }

  if (body.occurredOn !== entry.occurredOn)
    changes.occurredOn = body.occurredOn;

  // The API sends "HH:MM:SS"; the form's time is "HH:MM".
  if (
    (body.occurredAtTime ?? "").slice(0, 5) !==
    (entry.occurredAtTime ?? "").slice(0, 5)
  ) {
    changes.occurredAtTime = body.occurredAtTime;
  }

  if ((body.others ?? null) !== (entry.others ?? null)) {
    changes.others = body.others;
  }

  if ((body.text ?? null) !== (entry.text ?? null)) changes.text = body.text;

  if (body.visibility !== entry.visibility)
    changes.visibility = body.visibility;

  const peopleKeys = (body.people ?? []).map((p) =>
    "guestId" in p ? `guest:${p.guestId}` : `member:${p.memberId}`,
  );
  const entryPeople = entry.people.map((p) =>
    p.guestId !== null ? `guest:${p.guestId}` : `member:${p.memberId}`,
  );

  if (!sameSet(peopleKeys, entryPeople)) changes.people = body.people;

  if (
    !sameSet(
      (body.participants ?? []).map(String),
      entry.participants.map((p) => String(p.memberId)),
    )
  ) {
    changes.participants = body.participants;
  }

  return changes;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="text-[13px] text-danger" id={id} role="alert">
      {message}
    </p>
  );
}

const chipClass =
  "inline-flex h-9 items-center gap-0.5 rounded-full pl-3 pr-0.5 text-sm font-semibold";

function Chip({
  name,
  removeLabel,
  tone,
  onRemove,
}: {
  name: string;
  removeLabel: string;
  tone: "accent" | "plain";
  onRemove: () => void;
}) {
  return (
    <span
      className={clsx(
        chipClass,
        tone === "accent"
          ? "bg-accent-soft text-accent-soft-foreground"
          : "border border-border bg-surface text-heading",
      )}
    >
      {name}
      <button
        aria-label={removeLabel}
        className="flex size-8 items-center justify-center rounded-full"
        type="button"
        onClick={onRemove}
      >
        <XMarkIcon aria-hidden="true" className="size-3.5" strokeWidth={2} />
      </button>
    </span>
  );
}

const addChipClass =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-field-border px-3 text-sm font-semibold text-heading hover:bg-surface-secondary";

/**
 * The care log form (care spec rules 1–6, 12): a dialog from `md` up, a bottom sheet below. One
 * form for the three things it does: log or plan care (`new`), change your own entry (`edit`) and
 * *Record how it went* (`complete`, which can also mark the plan as not done). A failed save
 * keeps everything typed and shows the API's reason under the field it belongs to (`link` as a
 * banner). Focus goes back to whatever opened it through `onOpenChange`.
 */
export function CareLogForm({
  isOpen,
  mode,
  today,
  initialPeople = [],
  source,
  onOpenChange,
  onSaved,
}: {
  isOpen: boolean;
  mode: CareLogFormMode;
  /** The church's today ("YYYY-MM-DD"), the latest a done entry can be and the earliest a plan. */
  today: string;
  /** The people to start with (a person's timeline, an attendance row, tagged people). */
  initialPeople?: CareLogPerson[];
  source?: CareLogSourceInfo;
  onOpenChange: (isOpen: boolean) => void;
  /** `entry` is what the API saved, for a new entry or plan. */
  onSaved: (what: CareLogSaved, entry?: CareLogEntry) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container
        className={isDesktop ? undefined : "p-0 sm:w-full sm:p-0"}
        placement={isDesktop ? "center" : "bottom"}
        size="lg"
      >
        <Modal.Dialog
          className={clsx(
            "flex max-h-[calc(100dvh-1.5rem)] flex-col gap-0 overflow-hidden p-0",
            isDesktop
              ? "sm:max-w-[640px]"
              : "max-w-none rounded-b-none rounded-t-panel",
          )}
        >
          <FormBody
            initialPeople={initialPeople}
            isDesktop={isDesktop}
            mode={mode}
            source={source}
            today={today}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function FormBody({
  mode,
  today,
  initialPeople,
  source,
  isDesktop,
  onClose,
  onSaved,
}: {
  mode: CareLogFormMode;
  today: string;
  initialPeople: CareLogPerson[];
  source?: CareLogSourceInfo;
  isDesktop: boolean;
  onClose: () => void;
  onSaved: (what: CareLogSaved, entry?: CareLogEntry) => void;
}) {
  const t = useTranslations("CareLog");
  const locale = useLocale() as Locale;
  const complete = mode.type === "complete";
  const editing = mode.type === "edit";
  const entry = mode.type === "new" ? null : mode.entry;
  const [kind, setKind] = useState<CareLogKind>(entry?.kind ?? "call");
  const [when, setWhen] = useState<"done" | "planned">(
    entry?.status === "planned" && !complete ? "planned" : "done",
  );
  const [meeting, setMeeting] = useState<CareLogMeetingMode>(
    entry?.meetingMode ?? "inPerson",
  );
  const [heardFrom, setHeardFrom] = useState(entry?.heardFrom ?? "");
  const [date, setDate] = useState(
    complete && entry ? entry.occurredOn : (entry?.occurredOn ?? today),
  );
  const [time, setTime] = useState(entry?.occurredAtTime ?? "");
  const [people, setPeople] = useState<CareLogPerson[]>(() =>
    entry
      ? entry.people.flatMap((person): CareLogPerson[] =>
          person.memberId !== null
            ? [
                {
                  type: "member" as const,
                  id: person.memberId,
                  name: person.name,
                },
              ]
            : person.guestId !== null
              ? [
                  {
                    type: "guest" as const,
                    id: person.guestId,
                    name: person.name,
                  },
                ]
              : [],
        )
      : initialPeople.slice(0, MAX_PEOPLE),
  );
  const [others, setOthers] = useState(entry?.others ?? "");
  const [othersOpen, setOthersOpen] = useState(Boolean(entry?.others));
  const [participants, setParticipants] = useState<
    { memberId: number; name: string }[]
  >(entry?.participants ?? []);
  const [text, setText] = useState(complete ? "" : (entry?.text ?? ""));
  const [visibility, setVisibility] = useState<CareLogVisibility>(
    entry?.visibility ?? "leaders",
  );
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // The picker under *About* or *Who else took part*, with its own search.
  const [picker, setPicker] = useState<"people" | "with" | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<PickerOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [memberOptions, setMemberOptions] = useState<
    { id: number; name: string }[] | null
  >(null);
  const searchSeq = useRef(0);
  const peopleResults = useRef(new Map<string, CareLogPerson>());
  const pickerInput = useRef<HTMLInputElement>(null);
  const addPeopleButton = useRef<HTMLButtonElement>(null);
  const addWithButton = useRef<HTMLButtonElement>(null);
  const [audience, setAudience] = useState<CareLogAudience | null>(null);

  const canPlan =
    !complete && !editing
      ? PLANNABLE.includes(kind)
      : !complete && entry?.status === "planned";
  const planned = canPlan && when === "planned";
  // A plan keeps the date it has even after it has passed (the API lets an existing plan stay in
  // the past); only a new date has to be today or later.
  const minPlanDate =
    editing && entry?.status === "planned" && entry.occurredOn < today
      ? entry.occurredOn
      : today;
  const first = people[0] ? firstNameOf(people[0].name) : "";
  const nameForText = people.length === 1 ? first : "";

  // Opening a picker puts the cursor in its search box.
  useEffect(() => {
    if (picker) pickerInput.current?.focus();
  }, [picker]);

  // People search, after a short pause; a late answer to an old query is dropped.
  useEffect(() => {
    if (picker !== "people") return;

    const text = query.trim();

    if (text.length < 2) {
      // An answer still on its way for an earlier, longer query must not land now.
      searchSeq.current += 1;
      setFound([]);
      setSearching(false);
      setSearchFailed(false);

      return;
    }

    const seq = ++searchSeq.current;

    setSearching(true);

    const timer = window.setTimeout(async () => {
      const result = await searchCareLogPeopleAction(text);

      if (seq !== searchSeq.current) return;

      setSearching(false);
      setSearchFailed(!result.ok);

      if (!result.ok) return;

      const chosen = new Set(people.map(personKey));

      peopleResults.current = new Map(
        result.value.map(({ person }) => [personKey(person), person]),
      );
      setFound(
        result.value
          .filter(({ person }) => !chosen.has(personKey(person)))
          .map(({ person, groups, phoneLast4 }) => ({
            key: personKey(person),
            name: person.name,
            tag: person.type === "guest" ? t("guestWord") : undefined,
            detail:
              [
                groups.map((group) => group.name).join(" · "),
                phoneLast4 ? t("phoneEnds", { last4: phoneLast4 }) : "",
              ]
                .filter(Boolean)
                .join(" · ") || undefined,
          })),
      );
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timer);
    // `people` only filters the list; a new chip doesn't need a new search.
  }, [picker, query]);

  // Members for *Who else took part*, fetched the first time the picker opens.
  useEffect(() => {
    if (picker !== "with" || memberOptions !== null) return;

    let cancelled = false;

    setSearching(true);
    void listCareLogParticipantOptionsAction().then((result) => {
      if (cancelled) return;

      setSearching(false);
      setSearchFailed(!result.ok);
      // A failure isn't cached: closing and reopening the picker asks again.
      if (result.ok) setMemberOptions(result.value);
    });

    return () => {
      cancelled = true;
    };
  }, [picker, memberOptions]);

  // Who among the participants gains the entry by being named (rule 3).
  useEffect(() => {
    // Any change drops the old answer at once; the new check fills it in again.
    setAudience(null);

    // Without people the API answers 422; there is nothing to warn about yet.
    if (complete || participants.length === 0 || people.length === 0) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await checkCareLogAudienceAction({
        people: people.map(toPersonInput),
        visibility,
        participants: participants.map((p) => p.memberId),
      });

      if (!cancelled) setAudience(result.ok ? result.value : null);
    }, AUDIENCE_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [complete, participants, people, visibility]);

  function openPicker(which: "people" | "with") {
    setPicker(which);
    setQuery("");
    setFound([]);
    setSearchFailed(false);
  }

  function closePicker() {
    const opener = picker === "people" ? addPeopleButton : addWithButton;

    setPicker(null);
    window.requestAnimationFrame(() => opener.current?.focus());
  }

  function pickKind(next: CareLogKind) {
    setKind(next);
    setErrors((current) => ({ ...current, kind: undefined }));

    if (!PLANNABLE.includes(next) && when === "planned") changeWhen("done");
  }

  function changeWhen(next: "done" | "planned") {
    setWhen(next);
    // A date that was fine for one is out of range for the other.
    setDate(today);
    setTime("");
    setErrors((current) => ({ ...current, date: undefined }));
  }

  function handleFailure(code: CareLogFailureCode, message: string) {
    const field = FIELD_OF[code];

    if (field) {
      setErrors((current) => ({ ...current, [field]: message }));
      setBanner(null);
    } else {
      setBanner(message);
    }
  }

  function save() {
    const next: Partial<Record<Field, string>> = {};

    if (!complete) {
      if (people.length === 0) next.people = t("errors.people");
      if (kind === "heard" && !heardFrom.trim()) {
        next.heard = t("errors.heard_from");
      }
    }

    if (!planned && !text.trim()) next.text = t("errors.text");

    setErrors(next);
    setBanner(null);

    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      if (complete && entry) {
        const result = await completeCareLogAction(entry.id, {
          text: text.trim(),
          occurredOn: date,
        });

        if (result.ok) onSaved("completed");
        else handleFailure(result.code, result.message);

        return;
      }

      const body: Omit<CareLogCreateInput, "status" | "source"> = {
        kind,
        meetingMode: kind === "meeting" ? meeting : null,
        occurredOn: date,
        // A done entry has no time field: editing one keeps the time a completed plan had.
        occurredAtTime: planned
          ? time || null
          : editing
            ? (entry?.occurredAtTime ?? null)
            : null,
        people: people.map(toPersonInput),
        others: others.trim() || null,
        participants: participants.map((p) => p.memberId),
        heardFrom: kind === "heard" ? heardFrom.trim() : null,
        text: text.trim() || null,
        visibility,
      };

      if (editing && entry) {
        // Only what changed, so editing the text of an entry about someone who has since become
        // inactive doesn't send them again (the API would answer 422 `people`).
        const changes = changedFields(entry, body);

        if (Object.keys(changes).length === 0) {
          onClose();

          return;
        }

        const patched = await updateCareLogAction(entry.id, changes);

        if (patched.ok) onSaved("updated");
        else handleFailure(patched.code, patched.message);

        return;
      }

      const result = await createCareLogAction({
        ...body,
        status: planned ? "planned" : "done",
        source: source?.input ?? null,
      });

      if (result.ok) onSaved(planned ? "planned" : "logged", result.value);
      else handleFailure(result.code, result.message);
    });
  }

  function markNotDone() {
    if (!entry) return;

    setBanner(null);
    startTransition(async () => {
      const result = await cancelCareLogAction(entry.id);

      if (result.ok) onSaved("cancelled");
      else handleFailure(result.code, result.message);
    });
  }

  const title = complete
    ? t("titleComplete")
    : editing
      ? t("titleEdit")
      : planned
        ? nameForText
          ? t("titlePlanFor", { name: nameForText })
          : t("titlePlan")
        : nameForText
          ? t("titleLogFor", { name: nameForText })
          : t("titleLog");
  const textLabel = complete
    ? t("textComplete")
    : planned
      ? t("textPurpose")
      : kind === "heard"
        ? t("textHeard")
        : kind === "note"
          ? t("textNote")
          : t("textHappened");
  const placeholder = complete
    ? t("placeholderComplete")
    : planned
      ? t("placeholderPurpose")
      : t("placeholderHappened");
  const dateLabel = complete
    ? t("dateComplete")
    : planned
      ? t("datePlanned")
      : t("dateDone");
  // Rule 3: naming someone gives them the entry. The warning is for who gains it, so someone
  // already on the entry being edited isn't warned again.
  const gains = new Set(
    (audience?.gains ?? [])
      .filter(
        (gain) =>
          !entry?.participants.some(
            (existing) => existing.memberId === gain.memberId,
          ),
      )
      .map((gain) => gain.memberId),
  );
  const optionList: PickerOption[] =
    picker === "with"
      ? (memberOptions ?? [])
          .filter(
            (member) =>
              !participants.some((p) => p.memberId === member.id) &&
              normalizeText(member.name).includes(normalizeText(query)),
          )
          .slice(0, 8)
          .map((member) => ({ key: String(member.id), name: member.name }))
      : found;
  const pickerStatus = searchFailed
    ? t("searchFailed")
    : picker === "people" && query.trim().length < 2
      ? t("searchHint")
      : searching
        ? t("searching")
        : optionList.length === 0
          ? t("noResults")
          : null;

  function pick(key: string) {
    if (picker === "people") {
      const person = peopleResults.current.get(key);

      if (person && people.length < MAX_PEOPLE) {
        setPeople((current) => [...current, person]);
        setErrors((current) => ({ ...current, people: undefined }));
      }
    } else {
      const member = memberOptions?.find((m) => String(m.id) === key);

      if (member) {
        setParticipants((current) => [
          ...current,
          { memberId: member.id, name: member.name },
        ]);
      }
    }

    closePicker();
  }

  const heading = (
    <div className="flex items-start gap-3 px-4 pb-2 pt-4 md:px-6 md:pt-[22px]">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
          {t("eyebrow")}
        </span>
        <Modal.Heading className="font-display text-2xl font-medium leading-[1.15] text-heading md:text-[28px]">
          {title}
        </Modal.Heading>
      </div>
      <button
        aria-label={t("close")}
        className="-mr-2.5 -mt-1.5 flex size-11 shrink-0 items-center justify-center rounded-[10px] text-heading"
        type="button"
        onClick={onClose}
      >
        <XMarkIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </button>
    </div>
  );

  return (
    <>
      {!isDesktop && (
        <span
          aria-hidden="true"
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
        />
      )}
      {heading}
      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-4 pb-5 pt-2.5 md:px-6 md:pb-6">
        {banner && (
          <p
            className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-[13.5px] font-semibold text-danger-soft-foreground"
            role="alert"
          >
            <ExclamationTriangleIcon
              aria-hidden="true"
              className="mt-px size-[18px] shrink-0"
              strokeWidth={1.8}
            />
            {banner}
          </p>
        )}

        {complete && entry && (
          <div className="flex gap-3 rounded-xl border border-separator bg-surface-secondary px-4 py-3.5">
            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-warning-soft text-warning-soft-foreground">
              <CareKindIcon className="size-[17px]" kind={entry.kind} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="text-[15px] font-semibold text-heading">
                {entry.kind === "call" ||
                entry.kind === "meeting" ||
                entry.kind === "visit"
                  ? t(`titlesPlanned.${entry.kind}`)
                  : t(`titles.${entry.kind}`)}
              </span>
              <span className="text-[13.5px] text-muted">
                {t("planMeta", {
                  date: formatCalendarShortWeekdayDate(
                    entry.occurredOn,
                    locale,
                  ),
                  name: entry.author.name,
                })}
              </span>
              {entry.text && (
                <p className="mt-1 text-[14.5px] leading-normal text-foreground">
                  {entry.text}
                </p>
              )}
            </div>
          </div>
        )}

        {!complete && (
          <>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="pb-2.5 text-sm font-semibold text-heading">
                {t("kindQ")}
              </legend>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {KINDS.map((key) => {
                  const on = key === kind;
                  const disabled =
                    editing && entry?.status === "planned"
                      ? !PLANNABLE.includes(key)
                      : false;

                  return (
                    <button
                      key={key}
                      aria-pressed={on}
                      className={clsx(
                        "flex min-h-12 items-center gap-[9px] rounded-xl border-[1.5px] px-3 text-left text-sm font-semibold text-heading disabled:opacity-50",
                        on
                          ? "border-accent bg-surface-secondary"
                          : "border-border bg-surface",
                      )}
                      disabled={disabled}
                      type="button"
                      onClick={() => pickKind(key)}
                    >
                      <CareKindIcon
                        className={clsx(
                          "size-[18px] shrink-0",
                          on ? "text-heading" : "text-muted",
                        )}
                        kind={key}
                      />
                      <span className="min-w-0">{t(`kinds.${key}`)}</span>
                    </button>
                  );
                })}
              </div>
              <FieldError id="cl-kind-error" message={errors.kind} />
            </fieldset>

            {canPlan && !editing && (
              <fieldset>
                <legend className="pb-2.5 text-sm font-semibold text-heading">
                  {t("whenQ")}
                </legend>
                <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-surface-secondary p-1">
                  {(["done", "planned"] as const).map((value) => {
                    const on = value === when;

                    return (
                      <button
                        key={value}
                        aria-pressed={on}
                        className={clsx(
                          "inline-flex min-h-10 items-center gap-2 rounded-[9px] px-3.5 text-sm font-semibold",
                          on
                            ? "bg-surface text-heading shadow-segment"
                            : "text-muted",
                        )}
                        type="button"
                        onClick={() => changeWhen(value)}
                      >
                        {value === "done" ? (
                          <CheckCircleIcon
                            aria-hidden="true"
                            className="size-4"
                            strokeWidth={1.8}
                          />
                        ) : (
                          <CalendarIcon
                            aria-hidden="true"
                            className="size-4"
                            strokeWidth={1.8}
                          />
                        )}
                        {value === "done" ? t("whenDone") : t("whenPlanned")}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {kind === "meeting" && (
              <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
                <legend className="pb-2.5 text-sm font-semibold text-heading">
                  {t("modeQ")}
                </legend>
                {(["inPerson", "online"] as const).map((value) => (
                  <label
                    key={value}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] text-heading"
                  >
                    <input
                      checked={meeting === value}
                      className="size-[18px] accent-accent"
                      name="care-log-mode"
                      type="radio"
                      onChange={() => setMeeting(value)}
                    />
                    {value === "inPerson" ? t("modeInPerson") : t("modeOnline")}
                  </label>
                ))}
                <FieldError id="cl-mode-error" message={errors.mode} />
              </fieldset>
            )}

            {kind === "heard" && (
              <TextField
                className="gap-1.5"
                isInvalid={Boolean(errors.heard)}
                maxLength={200}
                value={heardFrom}
                onChange={setHeardFrom}
              >
                <Label className="text-sm font-semibold text-heading">
                  {t("heardQ")}
                </Label>
                <Input
                  autoComplete="off"
                  className="h-11 text-[15px]"
                  placeholder={t("heardPlaceholder")}
                />
                <FieldError id="cl-heard-error" message={errors.heard} />
              </TextField>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-3">
          <div className="min-w-[200px] flex-1">
            <CareDatePicker
              describedBy={errors.date ? "cl-date-error" : undefined}
              isInvalid={Boolean(errors.date)}
              label={dateLabel}
              max={planned ? undefined : today}
              min={planned ? minPlanDate : undefined}
              value={date}
              onChange={(value) => {
                setDate(value);
                setErrors((current) => ({ ...current, date: undefined }));
              }}
            />
            <FieldError id="cl-date-error" message={errors.date} />
          </div>
          {planned && (
            <TextField
              className="min-w-[140px] flex-1 gap-1.5"
              value={time}
              onChange={setTime}
            >
              <Label className="text-sm font-semibold text-heading">
                {t("time")}{" "}
                <span className="font-medium text-muted">{t("optional")}</span>
              </Label>
              <Input className="h-11 text-[15px]" type="time" />
            </TextField>
          )}
        </div>

        {!complete && (
          <>
            <div className="flex flex-col gap-2">
              <span
                className="text-sm font-semibold text-heading"
                id="cl-about"
              >
                {t("about")}
              </span>
              <div
                aria-labelledby="cl-about"
                className="flex flex-wrap items-center gap-2"
                role="group"
              >
                {people.map((person) => (
                  <Chip
                    key={personKey(person)}
                    name={person.name}
                    removeLabel={t("removePerson", { name: person.name })}
                    tone="accent"
                    onRemove={() =>
                      setPeople((current) =>
                        current.filter(
                          (p) => personKey(p) !== personKey(person),
                        ),
                      )
                    }
                  />
                ))}
                {people.length < MAX_PEOPLE && (
                  <button
                    ref={addPeopleButton}
                    className={addChipClass}
                    type="button"
                    onClick={() => openPicker("people")}
                  >
                    <PlusIcon
                      aria-hidden="true"
                      className="size-[15px]"
                      strokeWidth={2}
                    />
                    {t("addPerson")}
                  </button>
                )}
              </div>
              {picker === "people" && (
                <CarePickerPanel
                  closeLabel={t("close")}
                  inputRef={pickerInput as RefObject<HTMLInputElement | null>}
                  label={t("searchLabel")}
                  options={optionList}
                  placeholder={t("searchPlaceholder")}
                  query={query}
                  status={pickerStatus}
                  onClose={closePicker}
                  onPick={pick}
                  onQueryChange={setQuery}
                />
              )}
              <FieldError id="cl-people-error" message={errors.people} />
              {othersOpen ? (
                <TextField
                  className="mt-1 gap-1.5"
                  isInvalid={Boolean(errors.others)}
                  maxLength={200}
                  value={others}
                  onChange={setOthers}
                >
                  <Label className="text-[13.5px] font-semibold text-heading">
                    {t("othersLabel")}{" "}
                    <span className="font-medium text-muted">
                      {t("othersHint")}
                    </span>
                  </Label>
                  <Input
                    autoComplete="off"
                    className="h-11 text-[15px]"
                    placeholder={t("othersPlaceholder")}
                  />
                  <FieldError id="cl-others-error" message={errors.others} />
                </TextField>
              ) : (
                <button
                  className="inline-flex min-h-9 items-center self-start text-[13.5px] font-semibold text-heading underline decoration-gold-500 underline-offset-4"
                  type="button"
                  onClick={() => setOthersOpen(true)}
                >
                  {t("othersToggle")}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-heading" id="cl-with">
                {t("with")}{" "}
                <span className="font-medium text-muted">{t("optional")}</span>
              </span>
              <div
                aria-labelledby="cl-with"
                className="flex flex-wrap items-center gap-2"
                role="group"
              >
                {participants.map((member) => (
                  <Chip
                    key={member.memberId}
                    name={member.name}
                    removeLabel={t("removePerson", { name: member.name })}
                    tone="plain"
                    onRemove={() =>
                      setParticipants((current) =>
                        current.filter((p) => p.memberId !== member.memberId),
                      )
                    }
                  />
                ))}
                {participants.length < MAX_PEOPLE && (
                  <button
                    ref={addWithButton}
                    className={addChipClass}
                    type="button"
                    onClick={() => openPicker("with")}
                  >
                    <PlusIcon
                      aria-hidden="true"
                      className="size-[15px]"
                      strokeWidth={2}
                    />
                    {t("addWith")}
                  </button>
                )}
              </div>
              {picker === "with" && (
                <CarePickerPanel
                  closeLabel={t("close")}
                  inputRef={pickerInput as RefObject<HTMLInputElement | null>}
                  label={t("with")}
                  options={optionList}
                  placeholder={t("searchPlaceholder")}
                  query={query}
                  status={pickerStatus}
                  onClose={closePicker}
                  onPick={pick}
                  onQueryChange={setQuery}
                />
              )}
              {participants
                .filter((member) => gains.has(member.memberId))
                .map((member) => (
                  <p
                    key={member.memberId}
                    className="flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-[13.5px] text-warning-soft-foreground"
                    role="status"
                  >
                    <ExclamationTriangleIcon
                      aria-hidden="true"
                      className="mt-px size-4 shrink-0"
                      strokeWidth={1.8}
                    />
                    {t("gainsSee", { name: member.name })}
                  </p>
                ))}
              <FieldError
                id="cl-participants-error"
                message={errors.participants}
              />
            </div>
          </>
        )}

        <TextField
          className="gap-1.5"
          isInvalid={Boolean(errors.text)}
          maxLength={MAX_TEXT}
          value={text}
          onChange={(value) => {
            setText(value);
            setErrors((current) => ({ ...current, text: undefined }));
          }}
        >
          <Label className="text-sm font-semibold text-heading">
            {textLabel}
            {planned && (
              <>
                {" "}
                <span className="font-medium text-muted">{t("optional")}</span>
              </>
            )}
          </Label>
          <TextArea
            className="text-[15px] leading-[1.55]"
            placeholder={placeholder}
            rows={isDesktop ? 4 : 5}
          />
          <div className="flex justify-between gap-3">
            <Description className="text-[12.5px] text-muted">
              {t("hint")}
            </Description>
            <span className="text-[12.5px] tabular-nums text-muted">
              {t("counter", { count: text.length })}
            </span>
          </div>
          <FieldError id="cl-text-error" message={errors.text} />
        </TextField>

        {source && !complete && (
          <div className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5">
            {source.icon === "conversation" ? (
              <ChatBubbleLeftRightIcon
                aria-hidden="true"
                className="size-[17px] shrink-0 text-muted"
                strokeWidth={1.7}
              />
            ) : (
              <DocumentTextIcon
                aria-hidden="true"
                className="size-[17px] shrink-0 text-muted"
                strokeWidth={1.7}
              />
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-px">
              <span className="text-[12.5px] font-semibold text-muted">
                {t("from")}
              </span>
              {source.href ? (
                <NextLink
                  className="text-sm font-semibold text-heading underline decoration-border underline-offset-[3px]"
                  href={source.href}
                  target="_blank"
                >
                  {source.label}
                </NextLink>
              ) : (
                <span className="text-sm font-semibold text-heading">
                  {source.label}
                </span>
              )}
            </span>
          </div>
        )}

        {!complete && (
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-2.5 text-sm font-semibold text-heading">
              {t("visQ")}
            </legend>
            {(["leaders", "private"] as const).map((value) => {
              const on = visibility === value;
              const label =
                value === "private"
                  ? t("visPrivate")
                  : nameForText
                    ? t("visLeaders", { name: nameForText })
                    : t("visLeadersMany");
              const description =
                value === "private"
                  ? nameForText
                    ? t("visPrivateDesc", { name: nameForText })
                    : t("visPrivateManyDesc")
                  : nameForText
                    ? t("visLeadersDesc", { name: nameForText })
                    : t("visLeadersManyDesc");

              return (
                // The label's own text names the radio; the card is clickable through the
                // label's stretched ::after, and the description is read as its description.
                <div
                  key={value}
                  className={clsx(
                    "relative flex items-start gap-3 rounded-xl border-[1.5px] px-3.5 py-3",
                    on
                      ? "border-accent bg-surface-secondary"
                      : "border-border bg-surface",
                  )}
                >
                  <input
                    aria-describedby={`cl-vis-${value}-desc`}
                    checked={on}
                    className="mt-0.5 size-[18px] shrink-0 accent-accent"
                    id={`cl-vis-${value}`}
                    name="care-log-visibility"
                    type="radio"
                    onChange={() => setVisibility(value)}
                  />
                  <span className="flex flex-col gap-0.5">
                    <label
                      className="inline-flex cursor-pointer items-center gap-1.5 text-[15px] font-semibold text-heading after:absolute after:inset-0 after:content-['']"
                      htmlFor={`cl-vis-${value}`}
                    >
                      {value === "private" && (
                        <LockClosedIcon
                          aria-hidden="true"
                          className="size-3.5"
                          strokeWidth={1.8}
                        />
                      )}
                      {label}
                    </label>
                    <span
                      className="text-[13.5px] leading-[1.45] text-muted"
                      id={`cl-vis-${value}-desc`}
                    >
                      {description}
                    </span>
                  </span>
                </div>
              );
            })}
            <FieldError id="cl-visibility-error" message={errors.visibility} />
          </fieldset>
        )}

        {complete && entry && (
          <p className="flex items-center gap-2 text-[13.5px] text-muted">
            <LockClosedIcon
              aria-hidden="true"
              className="size-3.5 shrink-0"
              strokeWidth={1.8}
            />
            {entry.visibility === "private"
              ? t("seenByPrivate")
              : entry.people.length === 1
                ? t("seenByLeaders", {
                    name: firstNameOf(entry.people[0].name),
                  })
                : t("seenByLeadersMany")}
          </p>
        )}
      </div>

      <div className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2.5 border-t border-border bg-surface-secondary px-4 pb-5 pt-3.5 md:px-6 md:pb-3.5">
        {complete && (
          <button
            className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-danger underline underline-offset-4 disabled:opacity-50"
            disabled={isPending}
            type="button"
            onClick={markNotDone}
          >
            {t("didntHappen")}
          </button>
        )}
        <span className="flex-1" />
        <Button
          className="h-[46px] flex-1 font-semibold md:flex-none"
          isDisabled={isPending}
          variant="outline"
          onPress={onClose}
        >
          {t("cancel")}
        </Button>
        <Button
          className="h-[46px] flex-1 font-semibold md:flex-none"
          isPending={isPending}
          onPress={save}
        >
          {planned && !complete ? t("savePlan") : t("save")}
        </Button>
      </div>
    </>
  );
}
