"use client";

import type { GuestSearchItem } from "@/api/guests-api/types";
import type { MemberOption } from "@/api/members-api/types";
import type { OtherGroup } from "@/api/small-groups-api/types";
import type { PhoneParts } from "@/app/(app)/members/_lib/phone-countries";
import type { Locale } from "@/lib/locale-shared";
import type { Key, SubmitEvent } from "react";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ExclamationCircleIcon,
  PlusIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  Modal,
  TextField,
} from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";

import { GuestDatePicker } from "./guest-date-picker";

import {
  addGuestAction,
  searchGuestsAction,
} from "@/app/(app)/groups/_actions/guest-actions";
import { listMembersForPickerAction } from "@/app/(app)/groups/_actions/group-actions";
import { PhoneField } from "@/app/(app)/members/_components/phone-field";
import {
  composePhone,
  DEFAULT_COUNTRY,
} from "@/app/(app)/members/_lib/phone-countries";
import { InitialsAvatar } from "@/components/initials-avatar";
import { formatCalendarDate } from "@/lib/format-date";
import { normalizeText } from "@/lib/normalize-text";

const NEW_KEY = "__new__";
const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
const MAX_MEMBERS = 6;

/** Where the dialog is opened from: Group detail, or the report form (the guest came, joined that day). */
export type AddGuestVariant = "group" | "report";

interface AddGuestProps {
  groupId: number;
  groupName: string;
  variant: AddGuestVariant;
  /** The day they join ("YYYY-MM-DD"): today on Group detail, the meeting date in a report. */
  joinedAt: string;
  /** Today at the church: the latest first-visit date. */
  today: string;
  /** Called after the guest was added or moved; `name` is for the toast. */
  onAdded: (guest: { id: number; name: string }) => void;
  onClose: () => void;
}

// What a search result says about where the guest is, to recognise them.
export function GuestMeta({ guest }: { guest: GuestSearchItem }) {
  const t = useTranslations("AddGuestDialog");
  const locale = useLocale() as Locale;
  const parts: string[] = [];

  if (guest.phoneLast4)
    parts.push(t("phoneLast4", { digits: guest.phoneLast4 }));

  if (guest.currentGroup) {
    parts.push(
      t("currentGroup", {
        group: guest.currentGroup.name,
        date: formatCalendarDate(guest.currentGroup.joinedAt, locale),
      }),
    );
  } else if (guest.lastGroup) {
    parts.push(
      t("lastGroup", {
        group: guest.lastGroup.name,
        date: formatCalendarDate(guest.lastGroup.leftAt, locale),
      }),
    );
  } else {
    parts.push(t("noGroup"));
  }

  parts.push(
    guest.lastAttendedDate
      ? t("lastSeen", {
          date: formatCalendarDate(guest.lastAttendedDate, locale),
        })
      : t("neverSeen"),
  );

  return (
    <span className="block text-[13px] text-muted">{parts.join(" · ")}</span>
  );
}

function ErrorAlert({ children }: { children: string }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground"
      role="alert"
    >
      <ExclamationCircleIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0"
      />
      <span>{children}</span>
    </div>
  );
}

// Debounced church-wide search. `null` until the query is long enough; a newer query wins.
export function useGuestSearch(query: string) {
  const [state, setState] = useState<{
    query: string;
    guests: GuestSearchItem[];
    error: string | null;
  } | null>(null);
  const latest = useRef(0);
  const text = query.trim();

  useEffect(() => {
    if (text.length < MIN_QUERY) return;

    const run = ++latest.current;
    const timer = window.setTimeout(() => {
      void searchGuestsAction(text).then((result) => {
        if (run !== latest.current) return;

        setState({
          query: text,
          guests: result.ok ? result.guests : [],
          error: result.ok ? null : result.message,
        });
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [text]);

  if (text.length < MIN_QUERY)
    return { guests: [], error: null, loading: false };

  return {
    guests: state?.query === text ? state.guests : [],
    error: state?.query === text ? state.error : null,
    loading: state?.query !== text,
  };
}

function SearchStep({
  groupId,
  groupName,
  variant,
  joinedAt,
  today,
  setJoinedAt,
  query,
  setQuery,
  picked,
  setPicked,
  onNew,
  onAdded,
  onClose,
}: AddGuestProps & {
  setJoinedAt: (joinedAt: string) => void;
  query: string;
  setQuery: (query: string) => void;
  picked: GuestSearchItem | null;
  setPicked: (guest: GuestSearchItem | null) => void;
  onNew: () => void;
}) {
  const t = useTranslations("AddGuestDialog");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { guests, error: searchError, loading } = useGuestSearch(query);
  const [error, setError] = useState<string | null>(null);
  // Set when the API says the guest is in another group we didn't know about.
  const [lateOther, setLateOther] = useState<OtherGroup | null>(null);
  const text = query.trim();
  const other: { name: string; date: string } | null = lateOther
    ? { name: lateOther.name, date: lateOther.joinedAt }
    : picked?.currentGroup && picked.currentGroup.id !== groupId
      ? { name: picked.currentGroup.name, date: picked.currentGroup.joinedAt }
      : null;
  const isMove = other !== null;

  // The modal puts focus on the dialog; move it to the search once that has happened.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleSelection(keys: "all" | Set<Key>) {
    const [key] = keys === "all" ? [] : [...keys];

    if (key === NEW_KEY) {
      onNew();

      return;
    }

    setLateOther(null);
    setError(null);
    setPicked(guests.find((guest) => String(guest.id) === key) ?? null);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!picked) return;

    const guest = picked;

    setError(null);
    startTransition(async () => {
      const result = await addGuestAction(String(groupId), {
        guestId: guest.id,
        joinedAt,
        moveFromOtherGroup: isMove,
      });

      if (result.ok) {
        onAdded({ id: result.guestId, name: guest.name });

        return;
      }

      if (result.error === "inAnotherGroup" && result.otherGroup) {
        setLateOther(result.otherGroup);
      } else if (result.error) {
        setError(t(`errors.${result.error}`, { name: guest.name }));
      } else {
        setError(result.message ?? t("errors.generic"));
      }
    });
  }

  const disabledKeys = guests
    .filter((guest) => guest.currentGroup?.id === groupId)
    .map((guest) => String(guest.id));
  let submitLabel = variant === "report" ? t("addReport") : t("add");

  if (isMove) submitLabel = variant === "report" ? t("moveReport") : t("move");

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {variant === "report" ? t("reportTitle") : t("title")}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">
          {variant === "report"
            ? t("reportSubtitle", { group: groupName })
            : t("subtitle", { group: groupName })}
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        <TextField
          fullWidth
          className="gap-1.5"
          isDisabled={isPending}
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPicked(null);
            setLateOther(null);
          }}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("searchLabel")}
          </Label>
          <Input
            ref={inputRef}
            autoComplete="off"
            placeholder={t("searchPlaceholder")}
          />
        </TextField>

        {searchError && <ErrorAlert>{searchError}</ErrorAlert>}

        <ListBox
          aria-label={t("results")}
          className="max-h-[280px] overflow-y-auto rounded-xl border border-separator p-1"
          disabledKeys={disabledKeys}
          selectedKeys={picked ? [String(picked.id)] : []}
          selectionMode="single"
          onSelectionChange={handleSelection}
        >
          {guests.map((guest) => (
            <ListBox.Item
              key={guest.id}
              id={String(guest.id)}
              textValue={guest.name}
            >
              <InitialsAvatar name={guest.name} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold break-words text-heading">
                  {guest.name}
                </span>
                <GuestMeta guest={guest} />
              </span>
              {disabledKeys.includes(String(guest.id)) && (
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {t("alreadyIn")}
                </span>
              )}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
          <ListBox.Item
            key={NEW_KEY}
            id={NEW_KEY}
            textValue={text ? t("newOption", { q: text }) : t("newOptionEmpty")}
          >
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-dashed border-field-border text-muted">
              <PlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold break-words text-heading">
                {text ? t("newOption", { q: text }) : t("newOptionEmpty")}
              </span>
              <span className="block text-[13px] text-muted">
                {t("newHint")}
              </span>
            </span>
          </ListBox.Item>
        </ListBox>
        {loading && (
          <p className="text-[13px] text-muted" role="status">
            {t("searching")}
          </p>
        )}

        {other && picked && (
          <div
            className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground"
            role="note"
          >
            {t("moveNote", {
              name: picked.name,
              group: other.name,
              date: formatCalendarDate(other.date, locale),
            })}
          </div>
        )}
        {variant === "group" && (
          <GuestDatePicker
            isDisabled={isPending}
            label={t("joinedAtLabel")}
            max={today}
            value={joinedAt}
            onChange={setJoinedAt}
          />
        )}
        {variant === "report" && (
          <p className="text-[13px] text-muted">{t("reportHint")}</p>
        )}
        {error && <ErrorAlert>{error}</ErrorAlert>}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="font-semibold"
          isDisabled={isPending}
          type="button"
          variant="outline"
          onPress={onClose}
        >
          {t("cancel")}
        </Button>
        <Button
          className="font-semibold"
          isDisabled={!picked}
          isPending={isPending}
          type="submit"
        >
          {submitLabel}
        </Button>
      </Modal.Footer>
    </form>
  );
}

function NewGuestStep({
  groupId,
  groupName,
  variant,
  joinedAt,
  today,
  setJoinedAt,
  initialName,
  onUse,
  onBack,
  onAdded,
  onClose,
}: AddGuestProps & {
  setJoinedAt: (joinedAt: string) => void;
  initialName: string;
  /** "Use this guest": back to the search with them picked. */
  onUse: (guest: GuestSearchItem) => void;
  onBack: () => void;
}) {
  const t = useTranslations("AddGuestDialog");
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState<PhoneParts>({
    country: DEFAULT_COUNTRY,
    number: "",
  });
  const [firstVisit, setFirstVisit] = useState(joinedAt);
  const [invitedBy, setInvitedBy] = useState<MemberOption | null>(null);
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<MemberOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  // Close matches by name and by phone, shown before saving.
  const byName = useGuestSearch(name);
  const byPhone = useGuestSearch(phone.number);
  const matches = useMemo(() => {
    const seen = new Set<number>();

    return [...byName.guests, ...byPhone.guests].filter((guest) => {
      if (seen.has(guest.id)) return false;

      seen.add(guest.id);

      return true;
    });
  }, [byName.guests, byPhone.guests]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => nameRef.current?.focus());

    void listMembersForPickerAction().then((result) => {
      setMembers(result.ok ? result.members : []);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const memberResults = useMemo(() => {
    const query = normalizeText(memberInput);

    return (members ?? [])
      .filter((member) => !query || normalizeText(member.name).includes(query))
      .slice(0, MAX_MEMBERS);
  }, [members, memberInput]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setNameError(true);
      nameRef.current?.focus();

      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addGuestAction(String(groupId), {
        newGuest: {
          name: name.trim(),
          ...(composePhone(phone) && { phone: composePhone(phone) }),
          firstVisitDate: firstVisit,
          ...(invitedBy && { invitedByMemberId: invitedBy.id }),
        },
        joinedAt,
      });

      if (result.ok) {
        onAdded({ id: result.guestId, name: name.trim() });

        return;
      }

      setError(
        result.error
          ? t(`errors.${result.error}`, { name: name.trim() })
          : (result.message ?? t("errors.generic")),
      );
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("newTitle")}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">
          {variant === "report"
            ? t("newReportSubtitle", { group: groupName })
            : t("newSubtitle", { group: groupName })}
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        {matches.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl bg-warning-soft p-3 text-warning-soft-foreground">
            <p className="text-sm font-semibold">{t("matchesTitle")}</p>
            <ul className="flex flex-col gap-1">
              {matches.map((guest) => (
                <li
                  key={guest.id}
                  className="flex flex-col items-start gap-2 rounded-[10px] bg-surface px-3 py-2 text-foreground sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold break-words text-heading">
                      {guest.name}
                    </span>
                    <GuestMeta guest={guest} />
                  </span>
                  <Button
                    className="font-semibold"
                    size="sm"
                    variant="outline"
                    onPress={() => onUse(guest)}
                  >
                    {t("useGuest")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <TextField
          fullWidth
          isRequired
          className="gap-1.5"
          isDisabled={isPending}
          isInvalid={nameError}
          validationBehavior="aria"
          value={name}
          onChange={(value) => {
            setName(value);
            setNameError(false);
          }}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("nameLabel")}
          </Label>
          <Input ref={nameRef} autoComplete="off" />
          {nameError && (
            <p className="text-[13px] text-danger">{t("nameRequired")}</p>
          )}
        </TextField>
        <PhoneField
          hasOther={false}
          isDisabled={isPending}
          value={phone}
          onChange={setPhone}
        />
        <GuestDatePicker
          isDisabled={isPending}
          label={t("firstVisitLabel")}
          max={today}
          value={firstVisit}
          onChange={setFirstVisit}
        />
        {variant === "group" && (
          <GuestDatePicker
            isDisabled={isPending}
            label={t("joinedAtLabel")}
            max={today}
            value={joinedAt}
            onChange={setJoinedAt}
          />
        )}
        <ComboBox
          allowsEmptyCollection
          fullWidth
          inputValue={memberInput}
          isDisabled={isPending}
          items={memberResults}
          menuTrigger="focus"
          selectedKey={invitedBy ? String(invitedBy.id) : null}
          onInputChange={(value) => {
            setMemberInput(value);
            if (invitedBy && value !== invitedBy.name) setInvitedBy(null);
          }}
          onSelectionChange={(key) => {
            const member =
              members?.find((candidate) => String(candidate.id) === key) ??
              null;

            setInvitedBy(member);
            if (member) setMemberInput(member.name);
          }}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("invitedByLabel")}
          </Label>
          <ComboBox.InputGroup>
            <Input autoComplete="off" placeholder={t("invitedByPlaceholder")} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox
              renderEmptyState={() => (
                <p className="px-3 py-2 text-sm text-muted">
                  {members === null ? t("loading") : t("noMembers")}
                </p>
              )}
            >
              {(member: MemberOption) => (
                <ListBox.Item id={String(member.id)} textValue={member.name}>
                  <InitialsAvatar name={member.name} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-heading">
                    {member.name}
                  </span>
                </ListBox.Item>
              )}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
        {error && <ErrorAlert>{error}</ErrorAlert>}
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="font-semibold"
          isDisabled={isPending}
          type="button"
          variant="outline"
          onPress={onBack}
        >
          {t("back")}
        </Button>
        <Button
          className="font-semibold"
          isDisabled={isPending}
          type="button"
          variant="ghost"
          onPress={onClose}
        >
          {t("cancel")}
        </Button>
        <Button
          className="gap-2 font-semibold"
          isPending={isPending}
          type="submit"
        >
          <UserPlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
          {variant === "report" ? t("addNewReport") : t("addNew")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

// The two steps share one state holder, so going back to the search keeps the query. Mounted only
// while open, so it always starts empty.
function AddGuestFlow(props: AddGuestProps) {
  const [joinedAt, setJoinedAt] = useState(props.joinedAt);
  const [step, setStep] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<GuestSearchItem | null>(null);

  if (step === "new") {
    return (
      <NewGuestStep
        {...props}
        initialName={query.trim()}
        joinedAt={joinedAt}
        setJoinedAt={setJoinedAt}
        onBack={() => setStep("search")}
        onUse={(guest) => {
          setPicked(guest);
          setQuery(guest.name);
          setStep("search");
        }}
      />
    );
  }

  return (
    <SearchStep
      {...props}
      joinedAt={joinedAt}
      picked={picked}
      query={query}
      setJoinedAt={setJoinedAt}
      setPicked={setPicked}
      setQuery={setQuery}
      onNew={() => setStep("new")}
    />
  );
}

/**
 * Add a guest to a guest group, or "Someone new came" (`variant="report"`): search first, then the
 * new-guest step with close matches. A dialog from `sm` up, a bottom sheet below. The caller shows
 * the toast and refreshes in `onAdded`.
 */
export function AddGuestDialog({
  isOpen,
  onOpenChange,
  ...props
}: Omit<AddGuestProps, "onClose"> & {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="auto" size="md">
        <Modal.Dialog className="sm:max-w-[520px]">
          <AddGuestFlow {...props} onClose={() => onOpenChange(false)} />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
