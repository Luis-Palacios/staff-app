"use client";

import type { LinkableUser } from "@/app/(app)/members/_actions/account-actions";
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

function UserOption({
  user,
  checked,
  disabled,
  tag,
  onSelect,
}: {
  user: LinkableUser;
  checked: boolean;
  disabled: boolean;
  tag?: string;
  onSelect: () => void;
}) {
  return (
    <label className="relative block">
      <input
        checked={checked}
        className="peer absolute inset-0 size-full cursor-pointer opacity-0"
        disabled={disabled}
        name="user"
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
        <InitialsAvatar name={user.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-heading">
            {user.name}
          </span>
          <span className="truncate text-[13px] text-muted">{user.email}</span>
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

function LinkUserForm({
  memberId,
  memberName,
  users,
  suggestedIds,
  loadError,
  onLinked,
  onClose,
}: {
  memberId: number;
  memberName: string;
  /** Null while loading. */
  users: LinkableUser[] | null;
  suggestedIds: string[];
  loadError: string | null;
  onLinked: (name: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("MemberAccountActions");
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggested = useMemo(
    () => (users ?? []).filter((user) => suggestedIds.includes(user.id)),
    [users, suggestedIds],
  );
  const others = useMemo(() => {
    const needle = normalizeText(query);

    return (users ?? [])
      .filter((user) => !suggestedIds.includes(user.id))
      .filter(
        (user) =>
          !needle ||
          normalizeText(user.name).includes(needle) ||
          normalizeText(user.email).includes(needle),
      )
      .slice(0, MAX_RESULTS);
  }, [users, suggestedIds, query]);
  const selected = users?.find((user) => user.id === selectedId) ?? null;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected) return;

    setError(null);
    startTransition(async () => {
      const result = await linkMemberUserAction(String(memberId), selected.id);

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
          {t("linkSubtitle", { name: memberName })}
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 p-1">
        {users === null && !loadError && (
          <p className="text-sm text-muted">{t("loading")}</p>
        )}

        {suggested.length > 0 && (
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] font-semibold text-heading">
              {t("suggestedMatch")}
            </legend>
            {suggested.map((user) => (
              <UserOption
                key={user.id}
                checked={selectedId === user.id}
                disabled={isPending}
                tag={t("sameEmail")}
                user={user}
                onSelect={() => setSelectedId(user.id)}
              />
            ))}
          </fieldset>
        )}

        {users !== null && (
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
            <legend className="mb-1 p-0 text-[13px] font-semibold text-heading">
              {suggested.length > 0 ? t("otherUsers") : t("users")}
            </legend>
            <Label className="sr-only" htmlFor="link-user-search">
              {t("searchLabel")}
            </Label>
            <Input
              autoComplete="off"
              id="link-user-search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <p className="text-[13px] text-muted">{t("onlyUnlinked")}</p>
            {others.length === 0 ? (
              <p className="py-2 text-sm text-muted">
                {query ? t("noMatches", { query }) : t("noUsers")}
              </p>
            ) : (
              others.map((user) => (
                <UserOption
                  key={user.id}
                  checked={selectedId === user.id}
                  disabled={isPending}
                  user={user}
                  onSelect={() => setSelectedId(user.id)}
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

// The form remounts on every open, so it always starts empty. The user list comes from the
// caller, which loads it when the dialog opens.
export function LinkUserDialog({
  isOpen,
  onOpenChange,
  memberId,
  memberName,
  users,
  suggestedIds,
  loadError,
  onLinked,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  memberId: number;
  memberName: string;
  users: LinkableUser[] | null;
  suggestedIds: string[];
  loadError: string | null;
  onLinked: (name: string) => void;
}) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="md">
        <Modal.Dialog className="sm:max-w-[520px]">
          <LinkUserForm
            loadError={loadError}
            memberId={memberId}
            memberName={memberName}
            suggestedIds={suggestedIds}
            users={users}
            onClose={() => onOpenChange(false)}
            onLinked={onLinked}
          />
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
