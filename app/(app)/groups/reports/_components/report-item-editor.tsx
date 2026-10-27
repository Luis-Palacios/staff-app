"use client";

import type { JSONContent } from "@tiptap/core";
import type { Node as ProseNode } from "@tiptap/pm/model";
import type { DraftSegment } from "@/app/(app)/groups/reports/_lib/report-items-draft";
import type { TagContext } from "@/app/(app)/groups/reports/_lib/report-tags";
import type { PersonKey } from "@/lib/report-items";
import type { ReactNode } from "react";
import type { PickerKeys } from "./tag-picker";

import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { Extension } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { Plugin } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import { exitSuggestion, Suggestion } from "@tiptap/suggestion";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { PersonTag } from "./report-tag-node";
import { TagPicker } from "./tag-picker";
import { TagPickerSheet } from "./tag-picker-sheet";

import { mergeText } from "@/app/(app)/groups/reports/_lib/report-items-draft";
import { findFirstNameWord } from "@/app/(app)/groups/reports/_lib/report-tags";
import {
  ITEM_MAX,
  segmentsLength,
  segmentsSize,
  splitLegacyText,
  TAGS_MAX,
  toPersonKey,
} from "@/lib/report-items";

/**
 * A row button (tag, remove): 40 px, hidden until the row is hovered or has focus, but still in the
 * tab order and shown once focused or while its picker is open. Touch has no hover, so it stays
 * visible there, at 44 px. The row is the `group/row` that the parent `<li>` provides.
 */
export const ROW_BUTTON =
  "flex size-10 shrink-0 items-center justify-center rounded-[10px] text-muted opacity-0 hover:bg-surface-secondary hover:text-heading focus-visible:opacity-100 aria-expanded:opacity-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100 [@media(hover:none)]:size-11 [@media(hover:none)]:opacity-100";

/** The quiet "n / 1024" counter shows from here, as the old text field's did. */
const COUNTER_FROM = 900;

/** An item holds a single paragraph: no line breaks of its own (rule 2). */
const ItemDocument = Document.extend({ content: "paragraph" });

/** Asks an item to take focus; `id` tells a new request from one it already handled. */
export interface FocusRequest {
  id: number;
  /** Editor positions inside the item (0 is the start). */
  position: number | "end";
}

/** What the editor reports when Enter or a multi-line paste breaks the item into several. */
export interface ItemBreak {
  /** The item's new contents, in order; the first replaces this item, the rest follow it. */
  parts: DraftSegment[][];
  /** Where the caret goes in the last part. */
  caret: number;
}

/** What the editor needs to tag people; without it the field is plain text only. */
export interface ItemTagging {
  context: TagContext;
  /** "{Section}, item {n}", for the phone sheet. */
  itemLabel: string;
}

/** Refuses any change that takes the item past the API's length or tag limits. */
const ItemLimits = Extension.create({
  name: "itemLimits",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (tr) => {
          if (!tr.docChanged) return true;

          let length = 0;
          let tags = 0;

          tr.doc.descendants((node) => {
            if (node.isText) length += node.text?.length ?? 0;
            else if (node.type.name === "personTag") {
              tags += 1;
              length += `@{${node.attrs.personType}:${node.attrs.personId}}`
                .length;
            }

            return true;
          });

          return length <= ITEM_MAX && tags <= TAGS_MAX;
        },
      }),
    ];
  },
});

interface AtState {
  mode: "at";
  query: string;
  command: (attrs: TagAttrs) => void;
}

interface TagAttrs {
  personType: "member" | "guest";
  personId: number;
  name: string;
}

type PickerState =
  | AtState
  | { mode: "button"; snapshotFocused: boolean }
  | null;

function docOf(segments: readonly DraftSegment[]): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: segments.flatMap((segment): JSONContent[] =>
          segment.type === "text"
            ? segment.text
              ? [{ type: "text", text: segment.text }]
              : []
            : [
                {
                  type: "personTag",
                  attrs: {
                    personType: segment.person.type,
                    personId: segment.person.id,
                    name: segment.person.name,
                  },
                },
              ],
        ),
      },
    ],
  };
}

/** The segments of a doc or a slice of one, in order. */
function segmentsOf(content: {
  descendants: (visit: (node: ProseNode) => boolean) => void;
}): DraftSegment[] {
  const segments: DraftSegment[] = [];

  content.descendants((node) => {
    if (node.isText) segments.push({ type: "text", text: node.text ?? "" });
    else if (node.type.name === "personTag") {
      segments.push({
        type: "person",
        person: {
          type: node.attrs.personType,
          id: node.attrs.personId,
          name: node.attrs.name,
        },
      });
    }

    return true;
  });

  return mergeText(segments);
}

function sameSegments(
  a: readonly DraftSegment[],
  b: readonly DraftSegment[],
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const PHONE_QUERY = "(max-width: 767px)";

function subscribePhone(callback: () => void) {
  const query = window.matchMedia(PHONE_QUERY);

  query.addEventListener("change", callback);

  return () => query.removeEventListener("change", callback);
}

function useIsPhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

/**
 * One item: a single-line rich field (it wraps, but Enter starts the next item). The parent owns
 * the list, so Enter, Backspace at the start and multi-line paste are handed up; the editor only
 * reports its own contents. With `tagging`, typing `@` or the person button picks a member or guest
 * and puts a chip in the text (rules 8–9).
 */
export function ReportItemEditor({
  segments,
  placeholder,
  ariaLabel,
  canBreak,
  focusRequest,
  tagging,
  trailing,
  onChange,
  onBreak,
  onMergeUp,
}: {
  segments: DraftSegment[];
  placeholder: string;
  ariaLabel: string;
  /** False at the 20-item limit: Enter and multi-line paste then do nothing special. */
  canBreak: boolean;
  focusRequest?: FocusRequest;
  tagging?: ItemTagging;
  /** Buttons after the tag button, at the end of the row (the parent's *Remove item*). */
  trailing?: ReactNode;
  onChange: (segments: DraftSegment[]) => void;
  onBreak: (itemBreak: ItemBreak) => void;
  /** Backspace at the start: join with the previous item, or remove this one when it's empty. */
  onMergeUp: () => void;
}) {
  const t = useTranslations("ReportForm");
  const tItems = useTranslations("ReportItems");
  const isPhone = useIsPhone();
  const anchorRef = useRef<HTMLDivElement>(null);
  // Whether the field had the focus when the person button was pressed (rule 9: caret or end).
  const snapshotRef = useRef(false);
  const keysRef = useRef<PickerKeys | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  const [activeId, setActiveId] = useState<string | undefined>();
  // The editor's handlers are created once; they read the latest props from here.
  const latest = useRef({
    canBreak,
    onChange,
    onBreak,
    onMergeUp,
    hasPicker: false,
  });

  useEffect(() => {
    latest.current = {
      canBreak,
      onChange,
      onBreak,
      onMergeUp,
      hasPicker: picker?.mode === "at",
    };
  });

  const tagged = new Set<PersonKey>(
    segments.flatMap((segment) =>
      segment.type === "person" ? [toPersonKey(segment.person)] : [],
    ),
  );
  const itemText = segments
    .map((segment) =>
      segment.type === "text" ? segment.text : segment.person.name,
    )
    .join("");
  const canTag = tagging !== undefined;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ItemDocument,
      Paragraph,
      Text,
      PersonTag,
      ItemLimits,
      Placeholder.configure({ placeholder }),
      Extension.create({
        name: "atTrigger",
        addProseMirrorPlugins() {
          return [
            Suggestion<unknown, TagAttrs>({
              editor: this.editor,
              char: "@",
              allowSpaces: true,
              items: () => [],
              command: ({ editor: current, range, props }) => {
                current
                  .chain()
                  .focus()
                  .insertContentAt(range, [
                    { type: "personTag", attrs: props },
                    { type: "text", text: " " },
                  ])
                  .run();
              },
              render: () => {
                const open = (props: {
                  query: string;
                  command: (attrs: TagAttrs) => void;
                }) =>
                  setPicker({
                    mode: "at",
                    query: props.query,
                    command: props.command,
                  });

                return {
                  onStart: open,
                  onUpdate: open,
                  onExit: () =>
                    setPicker((current) =>
                      current?.mode === "at" ? null : current,
                    ),
                  onKeyDown: ({ event }) => keysRef.current?.(event) ?? false,
                };
              },
            }),
          ];
        },
      }),
    ],
    content: docOf(segments),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "false",
        "aria-label": ariaLabel,
        class: "outline-none",
      },
      handleKeyDown: (view, event) => {
        const { state } = view;
        const { selection } = state;

        // While `@` is open the picker owns the arrows, Enter, Tab and Esc.
        if (
          latest.current.hasPicker &&
          ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(
            event.key,
          ) &&
          keysRef.current?.(event)
        ) {
          return true;
        }

        if (event.key === "Enter" && !event.isComposing) {
          event.preventDefault();

          if (!latest.current.canBreak) return true;

          const before = segmentsOf(state.doc.slice(0, selection.from).content);
          const after = segmentsOf(state.doc.slice(selection.to).content);

          latest.current.onBreak({ parts: [before, after], caret: 0 });

          return true;
        }

        if (
          event.key === "Backspace" &&
          selection.empty &&
          selection.from === 1 &&
          !event.isComposing
        ) {
          event.preventDefault();
          latest.current.onMergeUp();

          return true;
        }

        return false;
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";

        if (!/[\r\n]/.test(text)) return false;

        event.preventDefault();

        const lines = splitLegacyText(text);

        if (lines.length === 0) return true;

        const { state } = view;
        const { selection } = state;
        const before = segmentsOf(state.doc.slice(0, selection.from).content);
        const after = segmentsOf(state.doc.slice(selection.to).content);
        const pasted = lines.map((line): DraftSegment[] => [
          { type: "text", text: line },
        ]);

        if (!latest.current.canBreak || pasted.length === 1) {
          // No room for more items (or one line): keep it all in this item, joined by spaces.
          view.dispatch(state.tr.insertText(lines.join(" ")));

          return true;
        }

        const last = pasted[pasted.length - 1] ?? [];

        latest.current.onBreak({
          parts: [
            mergeText([...before, ...(pasted[0] ?? [])]),
            ...pasted.slice(1, -1),
            mergeText([...last, ...after]),
          ],
          caret: segmentsSize(last),
        });

        return true;
      },
    },
    onUpdate: ({ editor: updated }) => {
      latest.current.onChange(segmentsOf(updated.state.doc));
    },
  });

  // The parent can rewrite an item (split, merge); show it unless it's what the editor already has.
  useEffect(() => {
    if (!editor) return;

    if (!sameSegments(segmentsOf(editor.state.doc), mergeText(segments))) {
      editor.commands.setContent(docOf(segments), { emitUpdate: false });
    }
  }, [editor, segments]);

  const handledFocus = useRef(0);

  useEffect(() => {
    if (!editor || !focusRequest || handledFocus.current === focusRequest.id) {
      return;
    }

    handledFocus.current = focusRequest.id;

    if (focusRequest.position === "end") editor.commands.focus("end");
    else editor.commands.focus(focusRequest.position + 1);
  }, [editor, focusRequest]);

  // The label follows the item's number; the open picker makes the editor its combobox owner.
  useEffect(() => {
    const dom = editor?.view.dom;

    if (!dom) return;

    dom.setAttribute("aria-label", ariaLabel);

    if (picker?.mode === "at" && !isPhone) {
      dom.setAttribute("aria-haspopup", "listbox");
      dom.setAttribute("aria-expanded", "true");

      const listId = activeId?.replace(/-\d+$/, "");

      if (listId) dom.setAttribute("aria-controls", listId);
      else dom.removeAttribute("aria-controls");

      if (activeId) dom.setAttribute("aria-activedescendant", activeId);
    } else {
      for (const name of [
        "aria-haspopup",
        "aria-expanded",
        "aria-controls",
        "aria-activedescendant",
      ]) {
        dom.removeAttribute(name);
      }
    }
  }, [editor, ariaLabel, picker, isPhone, activeId]);

  const closePicker = useCallback(() => {
    setPicker(null);

    if (!editor) return;

    exitSuggestion(editor.view);
    editor.commands.focus();
  }, [editor]);

  function pick(person: {
    type: "member" | "guest";
    id: number;
    name: string;
  }) {
    if (!editor || !picker) return;

    const attrs: TagAttrs = {
      personType: person.type,
      personId: person.id,
      name: person.name,
    };

    setPicker(null);

    if (picker.mode === "at") {
      picker.command(attrs);

      return;
    }

    // Rule 9: a name already written becomes the tag; otherwise the chip goes at the caret.
    const chip: JSONContent = { type: "personTag", attrs };
    let replaced = false;

    editor.state.doc.descendants((node, pos) => {
      if (replaced || !node.isText || !node.text) return true;

      const found = findFirstNameWord(node.text, person);

      if (found) {
        replaced = true;
        editor
          .chain()
          .insertContentAt(
            { from: pos + found.index, to: pos + found.index + found.length },
            chip,
          )
          .focus()
          .run();
      }

      return true;
    });

    if (replaced) return;

    const chain = editor.chain();

    if (!picker.snapshotFocused) chain.focus("end");

    chain
      .insertContent([chip, { type: "text", text: " " }])
      .focus()
      .run();
  }

  const length = segmentsLength(segments);
  const open = canTag && picker !== null;

  return (
    <div ref={anchorRef} className="flex min-w-0 flex-1 items-start">
      <div className="flex min-w-0 flex-1 flex-col">
        <EditorContent
          className={clsx(
            "min-h-11 w-full cursor-text px-3 py-[9px] text-[15px] leading-[1.55] text-field-foreground md:pl-0",
            "[&_.tiptap]:min-h-6 [&_.tiptap]:whitespace-pre-wrap [&_.tiptap]:break-words",
            "[&_.tiptap_p]:m-0",
            "[&_p.is-editor-empty]:before:pointer-events-none [&_p.is-editor-empty]:before:float-left [&_p.is-editor-empty]:before:-mb-6 [&_p.is-editor-empty]:before:h-6 [&_p.is-editor-empty]:before:max-w-full [&_p.is-editor-empty]:before:overflow-hidden [&_p.is-editor-empty]:before:text-ellipsis [&_p.is-editor-empty]:before:whitespace-nowrap [&_p.is-editor-empty]:before:text-field-placeholder [&_p.is-editor-empty]:before:content-[attr(data-placeholder)]",
          )}
          editor={editor}
        />
        {length >= COUNTER_FROM && (
          <span className="-mt-1 mb-1.5 self-end px-3 text-[13px] tabular-nums text-muted">
            {t("counter", { count: length })}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 py-0.5 pr-1.5">
        {canTag && (
          <button
            aria-expanded={picker?.mode === "button"}
            aria-haspopup="dialog"
            aria-label={tItems("tagSomeone")}
            className={ROW_BUTTON}
            data-tag-button=""
            title={tItems("tagSomeone")}
            type="button"
            onClick={() =>
              setPicker((current) =>
                current?.mode === "button"
                  ? null
                  : { mode: "button", snapshotFocused: snapshotRef.current },
              )
            }
            onPointerDown={() => {
              snapshotRef.current = editor?.isFocused ?? false;
            }}
          >
            <AtSymbolIcon
              aria-hidden="true"
              className="size-5"
              strokeWidth={1.7}
            />
          </button>
        )}
        {trailing}
      </div>
      {open && tagging && !isPhone && (
        <TagPicker
          anchorRef={anchorRef}
          context={tagging.context}
          itemText={itemText}
          keysRef={keysRef}
          mode={picker.mode}
          query={picker.mode === "at" ? picker.query : ""}
          tagged={tagged}
          onActive={setActiveId}
          onClose={closePicker}
          onPick={pick}
        />
      )}
      {open && tagging && isPhone && (
        <TagPickerSheet
          context={tagging.context}
          initialQuery={picker.mode === "at" ? picker.query : ""}
          itemLabel={tagging.itemLabel}
          itemText={itemText}
          keysRef={keysRef}
          mode={picker.mode}
          tagged={tagged}
          onClose={closePicker}
          onPick={pick}
        />
      )}
    </div>
  );
}
