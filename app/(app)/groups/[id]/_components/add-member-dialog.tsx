"use client";

import type { SmallGroupRole } from "@/api/members-api/types";
import type { MemberSummary } from "@/api/members-api/types";
import type { SmallGroupDetail } from "@/api/small-groups-api/types";
import type { Key, SubmitEvent } from "react";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button, ComboBox, Input, Label, ListBox, Modal } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import {
  addGroupMemberAction,
  setGroupLeaderAction,
} from "@/app/(app)/groups/_actions/group-actions";
import { InitialsAvatar } from "@/components/initials-avatar";
import { normalizeText } from "@/lib/normalize-text";

const MAX_RESULTS = 6;
const ALL_ROLES: SmallGroupRole[] = ["member", "co_leader", "leader"];

// Scoped users can't assign the leader (rule 9); same order as above.
export const SCOPED_ADD_ROLES: SmallGroupRole[] = ["member", "co_leader"];

function AddMemberForm({
  group,
  roles,
  members,
  loadError,
  onAdded,
  onClose,
}: {
  group: SmallGroupDetail;
  roles: SmallGroupRole[];
  /** Null while the members are still loading. */
  members: MemberSummary[] | null;
  loadError: string | null;
  onAdded: (name: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("GroupMembers");
  const tRole = useTranslations("SmallGroupRole");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState<MemberSummary | null>(null);
  const [role, setRole] = useState<SmallGroupRole>("member");
  const [error, setError] = useState<string | null>(null);
  const leader = group.members.find((member) => member.role === "leader");
  const inGroup = useMemo(
    () => new Set(group.members.map((member) => String(member.memberId))),
    [group.members],
  );

  const results = useMemo(() => {
    const query = normalizeText(inputValue);

    return (members ?? [])
      .filter(
        (member) =>
          !query ||
          normalizeText(member.name).includes(query) ||
          (member.email && normalizeText(member.email).includes(query)),
      )
      .slice(0, MAX_RESULTS);
  }, [members, inputValue]);

  function handleSelection(key: Key | null) {
    const member =
      members?.find((candidate) => String(candidate.id) === key) ?? null;

    setSelected(member);
    setError(null);
    if (member) setInputValue(member.name);
  }

  function handleInput(value: string) {
    setInputValue(value);

    // Typing over a picked member un-picks them.
    if (selected && value !== selected.name) setSelected(null);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) return;

    const person = selected;

    setError(null);
    startTransition(async () => {
      // Making someone leader while there is one is a swap: one call.
      const result =
        role === "leader" && leader
          ? await setGroupLeaderAction(String(group.id), person.id)
          : await addGroupMemberAction(String(group.id), person.id, role);

      if (result.ok) {
        onAdded(person.name);

        return;
      }

      if (result.error === "alreadyInGroup") {
        setError(t("errors.alreadyInGroup", { name: person.name }));
      } else if (result.error) {
        setError(t(`errors.${result.error}`));
      } else {
        setError(result.message ?? t("errors.generic"));
      }
    });
  }

  // The form remounts on every open. The modal puts focus on the dialog itself,
  // so move it to the search once that has happened.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    return () => window.cancelAnimationFrame(frame);
  }, []);

  let emptyText = t("noResults");

  if (members === null) emptyText = t("loading");
  else if (loadError) emptyText = loadError;

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("dialogTitle")}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">
          {t("dialogSubtitle", { group: group.name })}
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-5 overflow-visible p-1">
        <ComboBox
          allowsEmptyCollection
          fullWidth
          disabledKeys={inGroup}
          inputValue={inputValue}
          isDisabled={isPending}
          items={results}
          menuTrigger="focus"
          selectedKey={selected ? String(selected.id) : null}
          onInputChange={handleInput}
          onSelectionChange={handleSelection}
        >
          <Label className="text-[13px] font-semibold text-heading">
            {t("memberLabel")}
          </Label>
          <ComboBox.InputGroup>
            <Input
              ref={inputRef}
              autoComplete="off"
              placeholder={t("memberPlaceholder")}
            />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox
              renderEmptyState={() => (
                <p className="px-3 py-2 text-sm text-muted">{emptyText}</p>
              )}
            >
              {(member: MemberSummary) => (
                <ListBox.Item id={String(member.id)} textValue={member.name}>
                  <InitialsAvatar name={member.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-heading">
                      {member.name}
                    </span>
                    <span className="truncate text-[13px] text-muted">
                      {member.email ?? t("noEmail")}
                    </span>
                  </span>
                  {inGroup.has(String(member.id)) && (
                    <span className="shrink-0 text-xs font-semibold text-muted">
                      {t("alreadyIn")}
                    </span>
                  )}
                </ListBox.Item>
              )}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>

        <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
          <legend className="mb-1.5 p-0 text-[13px] font-semibold text-heading">
            {t("roleLabel")}
          </legend>
          <div className="inline-flex gap-0.5 self-start rounded-[10px] border border-border bg-segment p-[3px]">
            {roles.map((option) => (
              <label key={option} className="relative">
                <input
                  checked={role === option}
                  className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  disabled={isPending}
                  name="role"
                  type="radio"
                  onChange={() => setRole(option)}
                />
                <span
                  className={clsx(
                    "flex h-[34px] items-center rounded-[7px] px-3.5 text-sm font-semibold text-muted transition-colors",
                    "peer-hover:text-foreground",
                    "peer-checked:bg-segment-selected peer-checked:text-heading peer-checked:shadow-segment",
                    "peer-focus-visible:shadow-[var(--shadow-focus)]",
                  )}
                >
                  {tRole(option)}
                </span>
              </label>
            ))}
          </div>
          {role === "leader" && leader && (
            <p className="text-[13px] text-muted">
              {t("leaderHint", { leader: leader.memberName })}
            </p>
          )}
        </fieldset>

        {(error ?? (members !== null && loadError)) && (
          <div
            className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground"
            role="alert"
          >
            <ExclamationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <span>{error ?? loadError}</span>
          </div>
        )}
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
          isDisabled={!selected}
          isPending={isPending}
          type="submit"
        >
          {t("submit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

// "Add a member" dialog. The form inside remounts on every open, so it always
// starts empty; the members list is loaded once, by the caller, when the
// dialog first opens.
export function AddMemberDialog({
  isOpen,
  onOpenChange,
  group,
  roles = ALL_ROLES,
  members,
  loadError,
  onAdded,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  group: SmallGroupDetail;
  /** The roles that can be picked; scoped users can't pick `leader`. Defaults to all three. */
  roles?: SmallGroupRole[];
  members: MemberSummary[] | null;
  loadError: string | null;
  onAdded: (name: string) => void;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog className="sm:max-w-[520px]">
          <AddMemberForm
            group={group}
            loadError={loadError}
            members={members}
            roles={roles}
            onAdded={onAdded}
            onClose={() => onOpenChange(false)}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
