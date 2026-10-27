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
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { ReportItemEditor } from "./report-item-editor";
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

const HINT_KEY = {
  prayer: "prayerHint",
  praise: "praiseHint",
  followUp: "discussionHint",
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
 * One section as a list of items (rules 1–3): a numbered single-line editor each, *Remove item*
 * and *Add another*. Enter, Backspace at the start and multi-line paste change the list, so the
 * focus moves with them. The list always shows at least one item to type in.
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
  const focusId = useRef(0);
  const addRef = useRef<HTMLButtonElement>(null);
  const label = t(LABEL_KEY[section]);
  const full = items.length >= ITEMS_MAX;
  const onlyEmpty =
    items.length === 1 && isEmptyItem(items[0] ?? { segments: [] });

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

    // Past the limit, the overflow joins the last item that fits.
    const room = ITEMS_MAX - items.length + 1;
    const fitted =
      parts.length > room
        ? [...parts.slice(0, room - 1), parts.slice(room - 1).flat()]
        : parts;
    const [first = [], ...rest] = fitted.map(clamp);
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

    if (rest.length === 0) {
      const fresh = newDraftItem();

      onChange([fresh]);
      requestFocus(fresh.key, 0);

      return;
    }

    onChange(rest);

    if (neighbour) requestFocus(neighbour.key, "end");
    else addRef.current?.focus();
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-0.5 w-full p-0">
        <span className="block text-[13px] font-semibold text-heading md:flex md:min-h-9 md:items-end">
          <span>
            {label}{" "}
            <span className="font-normal text-muted">{t("optional")}</span>
          </span>
        </span>
        <span className="mt-1 block text-[13px] font-normal text-muted">
          {t(HINT_KEY[section])}
        </span>
      </legend>
      <ol className="flex flex-col gap-2">
        {items.map((item, index) => {
          const n = index + 1;

          return (
            <li key={item.key} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="hidden w-5 shrink-0 pt-[11px] text-right text-[13px] tabular-nums text-subtle md:block"
              >
                {n}
              </span>
              <ReportItemEditor
                ariaLabel={tItems("itemLabel", {
                  section: label,
                  n: String(n),
                })}
                canBreak={!full}
                focusRequest={focus?.key === item.key ? focus : undefined}
                placeholder={tItems(PLACEHOLDER_KEY[section])}
                segments={item.segments}
                tagging={
                  tagContext
                    ? {
                        context: tagContext,
                        itemLabel: tItems("itemLabel", {
                          section: label,
                          n: String(n),
                        }),
                      }
                    : undefined
                }
                onBreak={(itemBreak) => breakItem(index, itemBreak)}
                onChange={(segments) => replace(index, segments)}
                onMergeUp={() => mergeUp(index)}
              />
              {onlyEmpty ? (
                <span aria-hidden="true" className="size-11 shrink-0" />
              ) : (
                <button
                  aria-label={tItems("removeItem", {
                    n: String(n),
                    section: label,
                  })}
                  className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-muted hover:bg-surface-secondary hover:text-heading"
                  type="button"
                  onClick={() => remove(index)}
                >
                  <XMarkIcon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.8}
                  />
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <div className={clsx("flex flex-col gap-1.5", "md:pl-7")}>
        <button
          ref={addRef}
          className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-dashed border-field-border text-[13.5px] font-semibold text-muted hover:bg-surface-secondary hover:text-heading disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
          disabled={full}
          type="button"
          onClick={add}
        >
          <PlusIcon aria-hidden="true" className="size-4" strokeWidth={2} />
          {tItems("addItem")}
        </button>
        {full && (
          <p className="text-[13px] text-muted">{tItems("limitItems")}</p>
        )}
      </div>
    </fieldset>
  );
}

/**
 * The three sections of a report. `stacked` is the group step (one column); `grid` is the list step
 * and the edit form (three columns from `md`, each starting at the top).
 */
export function ReportItemsFields({
  items,
  tagContext,
  onChange,
  layout,
}: {
  items: DraftItems;
  tagContext?: TagContext;
  onChange: (section: ReportSectionKey, items: DraftItem[]) => void;
  layout: "stacked" | "grid";
}) {
  // Chip labels are per report (rule 11), so they're worked out across all three sections.
  const names = shortNames(REPORT_SECTION_KEYS.flatMap((key) => items[key]));

  return (
    <ShortNamesContext.Provider value={names}>
      <div
        className={
          layout === "grid"
            ? "grid items-start gap-4 md:grid-cols-3"
            : "flex flex-col gap-5"
        }
      >
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
