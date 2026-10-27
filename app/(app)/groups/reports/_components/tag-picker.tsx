"use client";

import type { Ref, RefObject } from "react";
import type { PersonKey } from "@/lib/report-items";
import type {
  TagContext,
  TagOption,
} from "@/app/(app)/groups/reports/_lib/report-tags";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useTagOptions } from "./use-tag-options";

import { GuestsBadge } from "@/components/guests-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { TAGS_MAX } from "@/lib/report-items";

/** What an item's editor hands the picker to read keys from (the editor keeps the focus). */
export type PickerKeys = (event: {
  key: string;
  preventDefault: () => void;
}) => boolean;

function OptionRow({
  option,
  id,
  active,
  tall,
  onPick,
  onHover,
}: {
  option: TagOption;
  id: string;
  active: boolean;
  tall: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  const t = useTranslations("ReportItems");
  const tRole = useTranslations("SmallGroupRole");
  const { person, roster, church } = option;
  const guest = person.type === "guest";
  let sub: string;
  let warn = false;

  if (roster) {
    const state =
      roster.state === "came"
        ? t("came")
        : roster.state === "missed"
          ? t("missed")
          : t("notMarked");

    sub = `${tRole(roster.role)} · ${state}`;
    warn = roster.state === "missed";
  } else if (church && guest) {
    sub = [
      church.groups[0]?.name,
      church.phoneLast4 ? t("phoneLast4", { digits: church.phoneLast4 }) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  } else if (church) {
    const group = church.groups[0];

    sub = group ? `${tRole(group.role)} · ${group.name}` : t("noGroup");
  } else {
    sub = "";
  }

  return (
    // Options are never focused: the field keeps the focus and points at the active one with
    // aria-activedescendant, and the keys are handled there.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
    <div
      aria-selected={active}
      className={clsx(
        "flex cursor-pointer items-center gap-3 px-3.5",
        tall ? "min-h-14 py-2" : "min-h-12 py-1.5",
        active && "bg-focus-row",
      )}
      id={id}
      role="option"
      onClick={onPick}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={onHover}
    >
      <InitialsAvatar
        className={
          guest
            ? "border border-field-border bg-transparent text-heading"
            : undefined
        }
        name={person.name}
        size="sm"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-heading">
          {person.name}
        </span>
        {sub && (
          <span
            className={clsx(
              "truncate text-[13px]",
              warn ? "text-warning-soft-foreground" : "text-muted",
            )}
          >
            {sub}
          </span>
        )}
      </span>
      {guest && <GuestsBadge label={t("guest")} />}
    </div>
  );
}

/**
 * The picker's list (rule 8): grouped options in a listbox, the first highlighted. The wrapper
 * (popover or sheet) owns where it sits and the search field; keys come in through `keysRef`, so
 * the item's editor can keep the focus while `@` is open.
 */
export function TagPickerBody({
  context,
  query,
  mode,
  itemText,
  tagged,
  tall = false,
  closeOnDeadEnd = false,
  keysRef,
  listId,
  onActive,
  onPick,
  onClose,
}: {
  context: TagContext;
  query: string;
  mode: "at" | "button";
  itemText: string;
  tagged: ReadonlySet<PersonKey>;
  tall?: boolean;
  /** `@` mode: a second space with nothing matching ends the query (rule 8 of the picker). */
  closeOnDeadEnd?: boolean;
  keysRef: RefObject<PickerKeys | null>;
  listId: string;
  onActive: (id: string | undefined) => void;
  onPick: (person: TagOption["person"]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("ReportItems");
  const full = tagged.size >= TAGS_MAX;
  const { sections, searching, failed } = useTagOptions({
    context,
    query,
    mode,
    itemText,
    tagged,
  });
  const options = full ? [] : sections.flatMap((section) => section.options);
  const signature = options.map((option) => option.key).join("|");
  const [active, setActive] = useState({ signature, index: 0 });
  // A new list starts at its first option.
  const index = active.signature === signature ? active.index : 0;
  const activeId = options.length > 0 ? `${listId}-${index}` : undefined;
  const trimmed = query.trim();

  const deadEnd =
    closeOnDeadEnd &&
    !searching &&
    options.length === 0 &&
    query.split(/\s+/).length > 2;

  useEffect(() => {
    if (deadEnd) onClose();
  }, [deadEnd, onClose]);

  useEffect(() => {
    onActive(activeId);
  }, [activeId, onActive]);

  useEffect(() => {
    keysRef.current = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();

        return true;
      }

      if (options.length === 0) return false;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();

        const step = event.key === "ArrowDown" ? 1 : -1;

        setActive({
          signature,
          index: (index + step + options.length) % options.length,
        });

        return true;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        const option = options[index];

        if (!option) return false;

        event.preventDefault();
        onPick(option.person);

        return true;
      }

      return false;
    };

    return () => {
      keysRef.current = null;
    };
  });

  useEffect(() => {
    document
      .getElementById(`${listId}-${index}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [listId, index]);

  const labelOf = (id: string) =>
    id === "named"
      ? t("namedHere")
      : id === "meeting"
        ? t("atMeeting")
        : id === "group"
          ? t("inGroup", { group: context.groupName })
          : t("restOfChurch");
  let offset = 0;

  return (
    <div
      aria-label={trimmed ? t("matching", { q: trimmed }) : t("search")}
      className={clsx("py-1", !tall && "max-h-72 overflow-y-auto")}
      id={listId}
      role="listbox"
    >
      {!full &&
        sections.map((section) => {
          const start = offset;

          offset += section.options.length;

          return (
            <div key={section.id} aria-label={labelOf(section.id)} role="group">
              <p
                aria-hidden="true"
                className="px-3.5 pb-1 pt-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow"
              >
                {labelOf(section.id)}
              </p>
              {section.options.map((option, i) => (
                <OptionRow
                  key={option.key}
                  active={start + i === index}
                  id={`${listId}-${start + i}`}
                  option={option}
                  tall={tall}
                  onHover={() => setActive({ signature, index: start + i })}
                  onPick={() => onPick(option.person)}
                />
              ))}
            </div>
          );
        })}
      {full && (
        <p className="px-3.5 py-3 text-[13.5px] text-muted">{t("limitTags")}</p>
      )}
      {!full && options.length === 0 && !searching && trimmed && (
        <p className="px-3.5 py-3 text-[13.5px] text-muted" role="status">
          {failed ? t("searchError") : t("none", { q: trimmed })}
        </p>
      )}
      {!full && searching && (
        <p className="px-3.5 py-2.5 text-[13px] text-muted" role="status">
          {t("searching")}
        </p>
      )}
    </div>
  );
}

/** The search field of the person button's popover and of the phone sheet. */
export function TagSearchField({
  ref,
  value,
  onChange,
  keysRef,
  listId,
  activeId,
  tall = false,
}: {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  keysRef: RefObject<PickerKeys | null>;
  listId: string;
  activeId: string | undefined;
  tall?: boolean;
}) {
  const t = useTranslations("ReportItems");

  return (
    <div className="relative">
      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        strokeWidth={1.8}
      />
      <input
        ref={ref}
        aria-activedescendant={activeId}
        aria-controls={listId}
        aria-expanded="true"
        aria-label={t("search")}
        autoComplete="off"
        className={clsx(
          "w-full rounded-[var(--field-radius)] border border-field-border bg-field pl-10 pr-3 text-sm text-field-foreground outline-none placeholder:text-field-placeholder focus:border-field-border-focus focus:shadow-[var(--shadow-focus)]",
          tall ? "h-12" : "h-10",
        )}
        placeholder={t("search")}
        role="combobox"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;

          keysRef.current?.(event);
        }}
      />
    </div>
  );
}

/**
 * The desktop picker: a popover under the item's field (400 px at most). It is portalled and fixed
 * to the field's rectangle, so a card with `overflow: hidden` can't clip it. In `button` mode it has
 * its own search field; with `@` the editor's text is the query.
 */
export function TagPicker({
  anchorRef,
  context,
  mode,
  query,
  itemText,
  tagged,
  keysRef,
  onActive,
  onPick,
  onClose,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  context: TagContext;
  mode: "at" | "button";
  /** The text after `@`; unused in `button` mode. */
  query: string;
  itemText: string;
  tagged: ReadonlySet<PersonKey>;
  keysRef: RefObject<PickerKeys | null>;
  onActive: (id: string | undefined) => void;
  onPick: TagPickerProps["onPick"];
  onClose: () => void;
}) {
  const t = useTranslations("ReportItems");
  const listId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | undefined>();
  const [box, setBox] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    function place() {
      const rect = anchorRef.current?.getBoundingClientRect();

      if (rect) {
        setBox({
          left: rect.left,
          top: rect.bottom + 4,
          width: Math.min(rect.width, 400),
        });
      }
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchorRef]);

  const placed = box !== null;

  // The popover renders once it has a position, so the field exists only from then on.
  useEffect(() => {
    if (mode === "button" && placed) searchRef.current?.focus();
  }, [mode, placed]);

  // A press outside the popover and the field closes it (the field's own clicks move the caret).
  useEffect(() => {
    function onDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        popoverRef.current?.contains(target) ||
        anchorRef.current?.contains(target) ||
        (target instanceof Element && target.closest("[data-tag-button]"))
      ) {
        return;
      }

      onClose();
    }

    document.addEventListener("pointerdown", onDown);

    return () => document.removeEventListener("pointerdown", onDown);
  }, [anchorRef, onClose]);

  if (!box) return null;

  const handleActive = (id: string | undefined) => {
    setActiveId(id);
    onActive(id);
  };

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 overflow-hidden rounded-xl border border-[var(--overlay-border)] bg-overlay shadow-overlay"
      style={{ left: box.left, top: box.top, width: Math.max(box.width, 280) }}
      onFocus={() => undefined}
    >
      {mode === "button" && (
        <div className="border-b border-separator p-2">
          <TagSearchField
            ref={searchRef}
            activeId={activeId}
            keysRef={keysRef}
            listId={listId}
            value={search}
            onChange={setSearch}
          />
        </div>
      )}
      <TagPickerBody
        closeOnDeadEnd={mode === "at"}
        context={context}
        itemText={itemText}
        keysRef={keysRef}
        listId={listId}
        mode={mode}
        query={mode === "button" ? search : query}
        tagged={tagged}
        onActive={handleActive}
        onClose={onClose}
        onPick={onPick}
      />
      <p className="border-t border-separator bg-surface-secondary/50 px-3.5 py-2 text-[12.5px] text-muted">
        {t("footer")}
      </p>
    </div>,
    document.body,
  );
}

interface TagPickerProps {
  onPick: (person: TagOption["person"]) => void;
}
