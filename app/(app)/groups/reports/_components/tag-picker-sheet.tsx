"use client";

import type { RefObject } from "react";
import type { PersonKey } from "@/lib/report-items";
import type {
  TagContext,
  TagOption,
} from "@/app/(app)/groups/reports/_lib/report-tags";
import type { PickerKeys } from "./tag-picker";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { TagPickerBody, TagSearchField } from "./tag-picker";

/**
 * The phone picker (rule 8): a bottom sheet with its own 48 px search field, prefilled with what
 * was typed after `@`, and 56 px rows. A modal dialog: focus stays inside and returns on close.
 */
export function TagPickerSheet({
  context,
  mode,
  initialQuery,
  itemLabel,
  itemText,
  tagged,
  keysRef,
  onPick,
  onClose,
}: {
  context: TagContext;
  mode: "at" | "button";
  /** What was typed after `@`. */
  initialQuery: string;
  /** "{Section}, item {n}", shown under the title. */
  itemLabel: string;
  itemText: string;
  tagged: ReadonlySet<PersonKey>;
  keysRef: RefObject<PickerKeys | null>;
  onPick: (person: TagOption["person"]) => void;
  onClose: () => void;
}) {
  const t = useTranslations("ReportItems");
  const listId = useId();
  const [search, setSearch] = useState(initialQuery);
  const [activeId, setActiveId] = useState<string | undefined>();

  return (
    <Modal.Backdrop
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Container placement="bottom">
        <Modal.Dialog
          aria-label={t("tagSomeone")}
          className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-b-none p-0"
        >
          <span
            aria-hidden="true"
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-separator"
          />
          <div className="flex items-start gap-3 px-4 pb-2 pt-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-medium text-heading">
                {t("tagSomeone")}
              </h2>
              <p className="truncate text-[13px] text-muted">{itemLabel}</p>
            </div>
            <button
              aria-label={t("close")}
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary hover:text-heading"
              type="button"
              onClick={onClose}
            >
              <XMarkIcon
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
            </button>
          </div>
          <div className="px-4 pb-2">
            <TagSearchField
              tall
              activeId={activeId}
              keysRef={keysRef}
              listId={listId}
              value={search}
              onChange={setSearch}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TagPickerBody
              tall
              context={context}
              itemText={itemText}
              keysRef={keysRef}
              listId={listId}
              mode={mode}
              query={search}
              tagged={tagged}
              onActive={setActiveId}
              onClose={onClose}
              onPick={onPick}
            />
          </div>
          <p className="border-t border-separator bg-surface-secondary/50 px-4 py-3 text-[13px] text-muted">
            {t("footerPhone")}
          </p>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
