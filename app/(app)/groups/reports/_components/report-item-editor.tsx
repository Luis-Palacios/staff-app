"use client";

import type { Editor } from "@tiptap/core";
import type { Node as ProseNode } from "@tiptap/pm/model";
import type { DraftSegment } from "@/app/(app)/groups/reports/_lib/report-items-draft";

import { Extension } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { Plugin } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { mergeText } from "@/app/(app)/groups/reports/_lib/report-items-draft";
import {
  ITEM_MAX,
  segmentsLength,
  segmentsSize,
  splitLegacyText,
} from "@/lib/report-items";

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

/** Refuses any change that would take the item past the API's length limit. */
const ItemLimit = Extension.create({
  name: "itemLimit",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (tr) =>
          !tr.docChanged || tr.doc.textContent.length <= ITEM_MAX,
      }),
    ];
  },
});

function docOf(segments: readonly DraftSegment[]) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: segments.flatMap((segment) =>
          segment.type === "text" && segment.text
            ? [{ type: "text", text: segment.text }]
            : [],
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

/**
 * One item: a single-line rich field (it wraps, but Enter starts the next item). The parent owns
 * the list, so Enter, Backspace at the start and multi-line paste are handed up; the editor only
 * reports its own contents.
 */
export function ReportItemEditor({
  segments,
  placeholder,
  ariaLabel,
  canBreak,
  focusRequest,
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
  onChange: (segments: DraftSegment[]) => void;
  onBreak: (itemBreak: ItemBreak) => void;
  /** Backspace at the start: join with the previous item, or remove this one when it's empty. */
  onMergeUp: () => void;
}) {
  // The editor's handlers are created once; they read the latest props from here.
  const latest = useRef({ canBreak, onChange, onBreak, onMergeUp });

  useEffect(() => {
    latest.current = { canBreak, onChange, onBreak, onMergeUp };
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ItemDocument,
      Paragraph,
      Text,
      ItemLimit,
      Placeholder.configure({ placeholder }),
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
          const joined = lines.join(" ");

          view.dispatch(state.tr.insertText(joined));

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

  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: {
          ...(editor.options.editorProps.attributes as Record<string, string>),
          "aria-label": ariaLabel,
        },
      },
    });
  }, [editor, ariaLabel]);

  const handledFocus = useRef(0);

  useEffect(() => {
    if (!editor || !focusRequest || handledFocus.current === focusRequest.id) {
      return;
    }

    handledFocus.current = focusRequest.id;
    focusEditor(editor, focusRequest.position);
  }, [editor, focusRequest]);

  const t = useTranslations("ReportForm");
  const length = segmentsLength(segments);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <EditorContent
        className={clsx(
          "min-h-11 w-full cursor-text rounded-[var(--field-radius)] border border-field-border bg-field px-3 py-[9px] text-sm leading-[1.55] text-field-foreground",
          "focus-within:border-field-border-focus focus-within:shadow-[var(--shadow-focus)]",
          "[&_.tiptap]:min-h-6 [&_.tiptap]:whitespace-pre-wrap [&_.tiptap]:break-words",
          "[&_.tiptap_p]:m-0",
          "[&_p.is-editor-empty]:before:pointer-events-none [&_p.is-editor-empty]:before:float-left [&_p.is-editor-empty]:before:h-0 [&_p.is-editor-empty]:before:text-field-placeholder [&_p.is-editor-empty]:before:content-[attr(data-placeholder)]",
        )}
        editor={editor}
      />
      {length >= COUNTER_FROM && (
        <span className="mt-1 self-end text-[13px] tabular-nums text-muted">
          {t("counter", { count: length })}
        </span>
      )}
    </div>
  );
}

function focusEditor(editor: Editor, position: number | "end") {
  if (position === "end") {
    editor.commands.focus("end");

    return;
  }

  editor.commands.focus(position + 1);
}
