"use client";

import type { MemberOption } from "@/api/members-api/types";
import type { KeyboardEvent, ReactNode, Ref } from "react";

import { useEffect, useId, useRef, useState } from "react";
import { InputGroup, TextField } from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { InitialsAvatar } from "@/components/initials-avatar";
import { searchMembersAction } from "@/app/(app)/_actions/search-members";

/** Matches the API's minimum; shorter text never leaves the browser. */
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

type Status = "idle" | "loading" | "done" | "error";

interface MemberSearchProps {
  className?: string;
  inputRef: Ref<HTMLInputElement>;
  /** The "Ctrl K" hint, shown at the end of the field. */
  shortcut: ReactNode;
  /** Called after a result is opened, so the collapsed mobile field can close. */
  onNavigate?: () => void;
}

/**
 * The top bar search: members by name. The server decides who is visible
 * (everyone for admins and elders, otherwise the members of the caller's
 * groups), so this only types, asks and lists. An ARIA combobox: focus stays
 * in the input and the arrow keys move `aria-activedescendant`.
 */
export const MemberSearch = ({
  className,
  inputRef,
  shortcut,
  onNavigate,
}: MemberSearchProps) => {
  const t = useTranslations("Topbar");
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState("");
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  // Answers can arrive out of order; only the latest request may set state.
  const requestId = useRef(0);
  const query = value.trim();
  const hasQuery = query.length >= MIN_QUERY_LENGTH;
  const showPanel = isOpen && hasQuery;

  useEffect(() => {
    if (!hasQuery) return;

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setStatus("loading");

      const result = await searchMembersAction(query);

      if (id !== requestId.current) return;

      setMembers(result.ok ? result.members : []);
      setStatus(result.ok ? "done" : "error");
      setActiveIndex(-1);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [hasQuery, query]);

  function handleChange(next: string) {
    setValue(next);
    setIsOpen(true);

    if (next.trim().length < MIN_QUERY_LENGTH) {
      // Drop any answer still in flight for the old text.
      requestId.current++;
      setMembers([]);
      setStatus("idle");
      setActiveIndex(-1);
    }
  }

  function open(member: MemberOption) {
    setIsOpen(false);
    setValue("");
    setMembers([]);
    setStatus("idle");
    router.push(`/members/${member.id}`);
    onNavigate?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (isOpen) event.stopPropagation();
      setIsOpen(false);

      return;
    }

    if (!hasQuery) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);

      if (members.length === 0) return;

      const step = event.key === "ArrowDown" ? 1 : -1;

      setActiveIndex(
        (current) => (current + step + members.length) % members.length,
      );
    } else if (event.key === "Enter" && showPanel) {
      // Enter on the highlighted result; with none highlighted, the only
      // result (typing a full name and pressing Enter is the common path).
      const target = members[activeIndex] ?? members[0];

      if (target && (activeIndex >= 0 || members.length === 1)) {
        event.preventDefault();
        open(target);
      }
    }
  }

  return (
    <TextField
      aria-label={t("search")}
      className={clsx("relative", className)}
      type="search"
      value={value}
      onBlur={(event) => {
        // Moving focus into the panel (a result) keeps it open.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
      onChange={handleChange}
    >
      <InputGroup className="h-[42px] w-full">
        <InputGroup.Prefix className="border-0 pr-2.5 pl-3">
          <MagnifyingGlassIcon
            className="pointer-events-none size-[18px] shrink-0 text-muted"
            strokeWidth={1.8}
          />
        </InputGroup.Prefix>
        <InputGroup.Input
          ref={inputRef}
          aria-activedescendant={
            showPanel && activeIndex >= 0
              ? `${listId}-${members[activeIndex]?.id}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={showPanel ? listId : undefined}
          aria-expanded={showPanel}
          autoComplete="off"
          className="text-sm"
          placeholder={t("searchPlaceholder")}
          role="combobox"
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <InputGroup.Suffix className="border-0 pr-2 pl-2">
          {shortcut}
        </InputGroup.Suffix>
      </InputGroup>

      {showPanel && (
        <div className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden rounded-[14px] border border-overlay-border bg-surface shadow-overlay-menu">
          {status === "done" && members.length > 0 ? (
            <ul
              aria-label={t("searchResults")}
              className="max-h-80 overflow-y-auto p-1.5"
              id={listId}
              role="listbox"
            >
              {members.map((member, index) => (
                // Keys are handled on the combobox input (aria-activedescendant).
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <li
                  key={member.id}
                  aria-selected={index === activeIndex}
                  className={clsx(
                    "flex h-11 cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 text-sm font-medium text-heading",
                    index === activeIndex
                      ? "bg-surface-secondary"
                      : "hover:bg-surface-secondary",
                  )}
                  id={`${listId}-${member.id}`}
                  role="option"
                  // Keep focus in the input so the panel doesn't blur shut.
                  onClick={() => open(member)}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <InitialsAvatar name={member.name} size="sm" />
                  <span className="truncate">{member.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="px-4 py-3 text-sm text-muted"
              id={listId}
              role="status"
            >
              {status === "error"
                ? t("searchError")
                : status === "done"
                  ? t("searchEmpty", { query })
                  : t("searching")}
            </p>
          )}
        </div>
      )}
    </TextField>
  );
};
