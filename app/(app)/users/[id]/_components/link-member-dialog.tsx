"use client";

import type { LinkableMember } from "@/app/(app)/members/_actions/account-actions";
import type { SubmitEvent } from "react";

import { useMemo, useState, useTransition } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button, Input, Label, Modal } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { linkMemberUserAction } from "@/app/(app)/members/_actions/account-actions";
import { InitialsAvatar } from "@/components/initials-avatar";
import { normalizeText } from "@/lib/normalize-text";

const MAX_RESULTS = 6;

function MemberOption({
  member,
  checked,
  disabled,
  tag,
  onSelect,
}: {
  member: LinkableMember;
  checked: boolean;
  disabled: boolean;
  tag?: string;
  onSelect: () => void;
}) {
  const t = useTranslations("UserMemberActions");

  return (
    <label className="relative block">
      <input
        checked={checked}
        className="peer absolute inset-0 size-full cursor-pointer opacity-0"
        disabled={disabled}
        name="member"
        type="radio"
        onChange={onSelect}
      />
      <span
        className={clsx(
          "flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors",
          "peer-hover:bg-default peer-checked:border-accent peer-checked:bg-accent-soft",
          "peer-focus-visible:shadow-[var(--shadow-focus)]",
        )}
      >
        <InitialsAvatar name={member.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-heading">
            {member.name}
          </span>
          <span className="truncate text-[13px] text-muted">
            {member.email ?? t("memberNumber", { id: String(member.id) })}
          </span>
        </span>
        {tag && (
          <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success-soft-foreground">
            {tag}
          </span>
        )}
      </span>
    </label>
  );
}

function LinkMemberForm({
  userId,
  userName,
  members,
  suggestedIds,
  loadError,
  onLinked,
  onClose,
}: {
  userId: string;
  userName: string;
  /** Null while loading. */
  members: LinkableMember[] | null;
  suggestedIds: number[];
  loadError: string | null;
  onLinked: (name: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("UserMemberActions");
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggested = useMemo(
    () => (members ?? []).filter((member) => suggestedIds.includes(member.id)),
    [members, suggestedIds],
  );
  const others = useMemo(() => {
    const needle = normalizeText(query);

    return (members ?? [])
      .filter((member) => !suggestedIds.includes(member.id))
      .filter(
        (member) =>
          !needle ||
          normalizeText(member.name).includes(needle) ||
          normalizeText(member.email ?? "").includes(needle),
      )
      .slice(0, MAX_RESULTS);
  }, [members, suggestedIds, query]);
  const selected = members?.find((member) => member.id === selectedId) ?? null;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) return;

    setError(null);
    startTransition(async () => {
      const result = await linkMemberUserAction(String(selected.id), userId);

      if (result.ok) onLinked(selected.name);
      else setError(result.error);
    });
  }

  const shownError = error ?? loadError;

  return (
    <form onSubmit={handleSubmit}>
      <Modal.Header className="flex-col items-start gap-1">
        <Modal.Heading className="font-display text-2xl font-medium text-heading">
          {t("linkTitle")}
        </Modal.Heading>
        <p className="text-sm font-normal text-muted">
          {t("linkSubtitle", { name: userName })}
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        {members === null && !loadError && (
          <p className="text-sm text-muted">{t("loading")}</p>
        )}

        {suggested.length > 0 && (
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] font-semibold text-heading">
              {t("suggestedMatch")}
            </legend>
            {suggested.map((member) => (
              <MemberOption
                key={member.id}
                checked={selectedId === member.id}
                disabled={isPending}
                member={member}
                tag={t("sameEmail")}
                onSelect={() => setSelectedId(member.id)}
              />
            ))}
          </fieldset>
        )}

        {members !== null && (
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] font-semibold text-heading">
              {suggested.length > 0 ? t("otherMembers") : t("members")}
            </legend>
            <Label className="sr-only" htmlFor="link-member-search">
              {t("searchLabel")}
            </Label>
            <Input
              autoComplete="off"
              id="link-member-search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <p className="text-[13px] text-muted">{t("onlyWithoutUser")}</p>
            {others.length === 0 ? (
              <p className="py-2 text-sm text-muted">
                {query ? t("noMatches", { query }) : t("noMembers")}
              </p>
            ) : (
              others.map((member) => (
                <MemberOption
                  key={member.id}
                  checked={selectedId === member.id}
                  disabled={isPending}
                  member={member}
                  onSelect={() => setSelectedId(member.id)}
                />
              ))
            )}
          </fieldset>
        )}

        {shownError && (
          <div
            className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-soft-foreground"
            role="alert"
          >
            <ExclamationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <span>{shownError}</span>
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
          {t("linkSubmit")}
        </Button>
      </Modal.Footer>
    </form>
  );
}

// The form remounts on every open, so it always starts empty. The member list comes from the
// caller, which loads it when the dialog opens.
export function LinkMemberDialog({
  isOpen,
  onOpenChange,
  userId,
  userName,
  members,
  suggestedIds,
  loadError,
  onLinked,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  userName: string;
  members: LinkableMember[] | null;
  suggestedIds: number[];
  loadError: string | null;
  onLinked: (name: string) => void;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog className="sm:max-w-[520px]">
          <LinkMemberForm
            loadError={loadError}
            members={members}
            suggestedIds={suggestedIds}
            userId={userId}
            userName={userName}
            onClose={() => onOpenChange(false)}
            onLinked={onLinked}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
