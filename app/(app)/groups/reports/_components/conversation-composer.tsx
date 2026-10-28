"use client";

import type { Ref } from "react";

import { Button } from "@heroui/react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

const MAX_LENGTH = 4000;
const COUNTER_FROM = 3600;

// The textarea, the audience note and the send button. The label is visually hidden. The counter
// shows only past 3600 characters; ⌘/Ctrl+Enter sends.
export function ConversationComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  note,
  isPending,
  textareaRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  /** Who sees it (and "Replying reopens it."), already assembled. */
  note: string;
  isPending: boolean;
  textareaRef: Ref<HTMLTextAreaElement>;
}) {
  const t = useTranslations("Conversations");
  const trimmed = value.trim().length;
  const canSend = trimmed > 0 && trimmed <= MAX_LENGTH && !isPending;

  return (
    <form
      className="flex flex-none flex-col gap-2.5 border-t border-separator bg-surface-secondary px-5 pb-[18px] pt-3.5"
      onSubmit={(event) => {
        event.preventDefault();

        if (canSend) onSubmit();
      }}
    >
      <label className="sr-only" htmlFor="conversation-composer">
        {t("composerLabel")}
      </label>
      <textarea
        ref={textareaRef}
        className="min-h-[88px] w-full resize-y rounded-[10px] border-[1.5px] border-field-border bg-field-background px-3 py-2.5 text-[14.5px] leading-normal text-field-foreground placeholder:text-field-placeholder focus:border-field-border-focus focus:shadow-focus focus:outline-none"
        id="conversation-composer"
        placeholder={placeholder}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();

            if (canSend) onSubmit();
          }
        }}
      />
      {value.length > COUNTER_FROM && (
        <p
          className={
            value.length > MAX_LENGTH
              ? "text-xs font-semibold text-danger"
              : "text-xs text-muted"
          }
        >
          {t("charsLeft", { count: String(MAX_LENGTH - value.length) })}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="flex min-w-[200px] flex-1 items-start gap-[7px] text-[12.5px] leading-snug text-muted">
          <EyeIcon
            aria-hidden="true"
            className="mt-px size-[15px] shrink-0"
            strokeWidth={1.8}
          />
          {note}
        </span>
        <Button
          className="h-[42px] px-[18px] font-semibold"
          isDisabled={!canSend}
          isPending={isPending}
          type="submit"
          variant="primary"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
