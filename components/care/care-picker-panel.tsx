"use client";

import type { RefObject } from "react";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { InputGroup, TextField } from "@heroui/react";
import { useId } from "react";

export interface PickerOption {
  key: string;
  name: string;
  /** A second line: groups, or the end of a phone number. */
  detail?: string;
  /** A small word after the name ("guest"). */
  tag?: string;
}

/**
 * The search box and result list that open under a chips row (*Add someone*, *Who else took
 * part*). It only draws: the caller searches and says what to show. Escape or the close button
 * hands the focus back through `onClose`.
 */
export function CarePickerPanel({
  label,
  placeholder,
  closeLabel,
  query,
  onQueryChange,
  options,
  status,
  inputRef,
  onPick,
  onClose,
}: {
  label: string;
  placeholder: string;
  closeLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  options: PickerOption[];
  /** A line under the box: "Type at least 2 letters.", "Searching…", "No one matches". */
  status: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const listId = useId();

  return (
    <div
      aria-label={label}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-2.5"
      role="group"
    >
      <div className="flex items-center gap-1.5">
        <TextField
          aria-label={label}
          className="min-w-0 flex-1"
          value={query}
          onChange={onQueryChange}
        >
          <InputGroup className="h-11 w-full">
            <InputGroup.Prefix className="border-0 pl-3 pr-2">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="pointer-events-none size-4 shrink-0 text-muted"
                strokeWidth={1.8}
              />
            </InputGroup.Prefix>
            <InputGroup.Input
              ref={inputRef}
              aria-controls={listId}
              autoComplete="off"
              className="text-[15px]"
              placeholder={placeholder}
              // Escape closes the picker, not the whole dialog.
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  onClose();
                }
              }}
            />
          </InputGroup>
        </TextField>
        <button
          aria-label={closeLabel}
          className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary hover:text-heading"
          type="button"
          onClick={onClose}
        >
          <XMarkIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </button>
      </div>
      {status && (
        <p className="px-1 text-[13px] text-muted" role="status">
          {status}
        </p>
      )}
      {options.length > 0 && (
        <ul className="flex max-h-56 flex-col overflow-y-auto" id={listId}>
          {options.map((option) => (
            <li key={option.key}>
              <button
                className="flex min-h-12 w-full flex-col items-start justify-center gap-0.5 rounded-lg px-3 py-1.5 text-left hover:bg-surface-secondary"
                type="button"
                onClick={() => onPick(option.key)}
              >
                <span className="text-[15px] font-semibold text-heading">
                  {option.name}
                  {option.tag && (
                    <span className="ml-1.5 text-[13px] font-normal text-muted">
                      {option.tag}
                    </span>
                  )}
                </span>
                {option.detail && (
                  <span className="text-[13px] text-muted">
                    {option.detail}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
