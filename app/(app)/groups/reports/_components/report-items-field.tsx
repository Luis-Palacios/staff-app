"use client";

import type { ReportSectionKey } from "@/api/small-groups-api/types";
import type {
  DraftItem,
  DraftItems,
  DraftSegment,
} from "@/app/(app)/groups/reports/_lib/report-items-draft";
import type { TagContext } from "@/app/(app)/groups/reports/_lib/report-tags";
import type { FocusRequest, ItemBreak } from "./report-item-editor";

import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { ReportItemEditor, ROW_BUTTON } from "./report-item-editor";
import { ShortNamesContext } from "./report-tag-node";

import {
  isEmptyItem,
  mergeText,
  newDraftItem,
} from "@/app/(app)/groups/reports/_lib/report-items-draft";
import {
  ITEM_MAX,
  ITEMS_MAX,
  segmentsLength,
  segmentsSize,
  shortNames,
} from "@/lib/report-items";
import { REPORT_SECTION_KEYS } from "@/lib/report-sections";

/** The `ReportForm` keys the labels and hints already live under. */
const LABEL_KEY = {
  prayer: "prayer",
  praise: "praise",
  followUp: "discussion",
} as const satisfies Record<ReportSectionKey, string>;

const PLACEHOLDER_KEY = {
  prayer: "placeholderPrayer",
  praise: "placeholderPraise",
  followUp: "placeholderFollowUp",
} as const satisfies Record<ReportSectionKey, string>;

/** Cuts text off at the item limit so a pasted wall of text can't make an item the API refuses. */
function clamp(segments: DraftSegment[]): DraftSegment[] {
  const kept: DraftSegment[] = [];
  let room = ITEM_MAX;

  for (const segment of mergeText(segments)) {
    const cost = segmentsLength([segment]);

    if (cost > room) {
      if (segment.type === "text" && room > 0) {
        kept.push({ type: "text", text: segment.text.slice(0, room) });
      }
      break;
    }

    kept.push(segment);
    room -= cost;
  }

  return kept;
}

/**
 * One section as a notepad (rules 1–3): one bordered box whose rows are the items, each a numbered
 * single-line editor with its @ and *Remove item* buttons, and a ghost row at the end that adds the
 * next item. Enter, Backspace at the start and multi-line paste change the list, so the focus moves
 * with them. A section can be empty: the box is then just the ghost row.
 */
export function ReportItemsField({
  section,
  items,
  tagContext,
  onChange,
}: {
  section: ReportSectionKey;
  items: DraftItem[];
  /** Who can be picked; without it the items are plain text. */
  tagContext?: TagContext;
  onChange: (items: DraftItem[]) => void;
}) {
  const t = useTranslations("ReportForm");
  const tItems = useTranslations("ReportItems");
  const [focus, setFocus] = useState<({ key: string } & FocusRequest) | null>(
    null,
  );
  const [refused, setRefused] = useState(false);
  const focusId = useRef(0);
  const addRef = useRef<HTMLButtonElement>(null);
  const focusGhost = useRef(false);
  const label = t(LABEL_KEY[section]);
  const full = items.length >= ITEMS_MAX;
  const filled = items.filter((item) => !isEmptyItem(item)).length;
  const lastItem = items[items.length - 1];
  // The last item, while still empty, is where to type; otherwise the ghost row starts the next one.
  const showGhost = !full && !(lastItem && isEmptyItem(lastItem));

  // After the last item is removed the ghost row is the only thing left to focus.
  useEffect(() => {
    if (focusGhost.current) {
      focusGhost.current = false;
      addRef.current?.focus();
    }
  });

  // The refusal note stays until the list changes (the refused paste itself changes nothing).
  useEffect(() => {
    setRefused(false);
  }, [items]);

  function requestFocus(key: string, position: number | "end") {
    focusId.current += 1;
    setFocus({ key, position, id: focusId.current });
  }

  function replace(index: number, segments: DraftSegment[]) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, segments } : item)),
    );
  }

  function breakItem(index: number, { parts, caret }: ItemBreak) {
    const current = items[index];

    if (!current) return;

    // A paste that would go past the limit is refused whole, with the limit text, rather than cut.
    if (parts.length > ITEMS_MAX - items.length + 1) {
      setRefused(true);

      return;
    }

    setRefused(false);

    const [first = [], ...rest] = parts.map(clamp);
    const added = rest.map((segments) => newDraftItem(segments));
    const next = [
      ...items.slice(0, index),
      { ...current, segments: first },
      ...added,
      ...items.slice(index + 1),
    ];

    onChange(next);

    const target = added[added.length - 1];

    if (target) requestFocus(target.key, caret);
  }

  function mergeUp(index: number) {
    const current = items[index];
    const previous = items[index - 1];

    if (!current || !previous) return;

    if (isEmptyItem(current)) {
      onChange(items.filter((_, i) => i !== index));
      requestFocus(previous.key, "end");

      return;
    }

    const joined = clamp([...previous.segments, ...current.segments]);

    onChange(
      items.flatMap((item, i) =>
        i === index - 1
          ? [{ ...item, segments: joined }]
          : i === index
            ? []
            : [item],
      ),
    );
    requestFocus(previous.key, segmentsSize(previous.segments));
  }

  function add() {
    const item = newDraftItem();

    onChange([...items, item]);
    requestFocus(item.key, 0);
  }

  function remove(index: number) {
    const rest = items.filter((_, i) => i !== index);
    const neighbour = items[index - 1] ?? items[index + 1];

    onChange(rest);

    if (neighbour) requestFocus(neighbour.key, "end");
    else focusGhost.current = true;
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-0.5 w-full p-0">
        <span className="flex items-baseline justify-between gap-3 text-[15px] font-semibold text-heading">
          <span>
            {label}{" "}
            <span className="font-normal text-muted">{t("optional")}</span>
          </span>
          {filled > 0 && (
            <span className="shrink-0 whitespace-nowrap text-[13px] font-normal tabular-nums text-muted">
              {tItems("count", { count: filled })}
            </span>
          )}
        </span>
      </legend>
      <ol className="divide-y divide-separator overflow-hidden rounded-xl border border-field-border bg-field focus-within:border-field-border-focus focus-within:shadow-[var(--shadow-focus)]">
        {items.map((item, index) => {
          const n = index + 1;
          const placeholder = tItems(PLACEHOLDER_KEY[section]);
          const itemLabel = tItems("itemLabel", {
            section: label,
            n: String(n),
          });

          return (
            <li
              key={item.key}
              className="group/row flex items-start focus-within:bg-surface-secondary/40"
            >
              <span
                aria-hidden="true"
                className="hidden w-10 shrink-0 pl-3 pt-[11px] text-[13px] tabular-nums text-muted md:block"
              >
                {n}
              </span>
              <ReportItemEditor
                // TipTap reads the placeholder once, so a language switch remounts the editor.
                key={placeholder}
                ariaLabel={itemLabel}
                canBreak={!full}
                focusRequest={focus?.key === item.key ? focus : undefined}
                placeholder={placeholder}
                segments={item.segments}
                tagging={
                  tagContext ? { context: tagContext, itemLabel } : undefined
                }
                trailing={
                  <button
                    aria-label={tItems("removeItem", {
                      n: String(n),
                      section: label,
                    })}
                    className={ROW_BUTTON}
                    type="button"
                    onClick={() => remove(index)}
                  >
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-5"
                      strokeWidth={1.8}
                    />
                  </button>
                }
                onBreak={(itemBreak) => breakItem(index, itemBreak)}
                onChange={(segments) => replace(index, segments)}
                onMergeUp={() => mergeUp(index)}
              />
            </li>
          );
        })}
        {showGhost && (
          <li>
            <button
              ref={addRef}
              className="flex min-h-[46px] w-full items-center text-left text-[15px] text-muted hover:bg-surface-secondary/40 hover:text-heading"
              type="button"
              onClick={add}
            >
              <span className="flex w-auto shrink-0 pl-3 pr-2.5 md:w-10 md:pr-0">
                <PlusIcon
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={2}
                />
              </span>
              {tItems(PLACEHOLDER_KEY[section])}
            </button>
          </li>
        )}
      </ol>
      {/* Always mounted, so a screen reader announces the text when it is filled in. */}
      <p className="text-[13px] text-muted empty:hidden" role="status">
        {full || refused ? tItems("limitItems") : null}
      </p>
    </fieldset>
  );
}

/**
 * The three sections of a report: always one column, in the group step, the list step, the review
 * and the edit form.
 */
export function ReportItemsFields({
  items,
  tagContext,
  onChange,
}: {
  items: DraftItems;
  tagContext?: TagContext;
  onChange: (section: ReportSectionKey, items: DraftItem[]) => void;
}) {
  // Chip labels are per report (rule 11), so they're worked out across all three sections.
  const names = shortNames(REPORT_SECTION_KEYS.flatMap((key) => items[key]));

  return (
    <ShortNamesContext.Provider value={names}>
      <div className="flex max-w-[760px] flex-col gap-7">
        {REPORT_SECTION_KEYS.map((section) => (
          <ReportItemsField
            key={section}
            items={items[section]}
            section={section}
            tagContext={tagContext}
            onChange={(next) => onChange(section, next)}
          />
        ))}
      </div>
    </ShortNamesContext.Provider>
  );
}
