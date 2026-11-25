"use client";

import type { CareLogNote } from "@/api/care-log-api/types";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Label, TextArea, TextField } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { useNoteLabels } from "./care-notes";

import {
  addCareLogNoteAction,
  deleteCareLogNoteAction,
  updateCareLogNoteAction,
} from "@/app/(app)/_actions/care-log-actions";
import { initialsOf } from "@/components/initials-avatar";
import { showToast } from "@/components/toast-host";

const MAX_TEXT = 4000;

type Mode =
  | { kind: "idle" }
  | { kind: "add" }
  | { kind: "edit"; noteId: number }
  | { kind: "delete"; noteId: number };

const ADD_ID = "care-note-add";
const editId = (noteId: number) => `care-note-edit-${noteId}`;

/**
 * *Notes from those who took part* on the entry's page (rules 59–62): every note in full, *Add your
 * note* for someone on the entry who hasn't written one, *Edit* and *Delete* on your own. One form is
 * open at a time. `startAdding` opens the add form on arrival (the calendar panel's link).
 */
export function EntryNotes({
  entryId,
  notes,
  canAddNote,
  viewerMemberId,
  startAdding,
}: {
  entryId: number;
  notes: CareLogNote[];
  canAddNote: boolean;
  viewerMemberId: number | null;
  startAdding: boolean;
}) {
  const t = useTranslations("CareLog.notes");
  const tCare = useTranslations("CareLog");
  const router = useRouter();
  const labels = useNoteLabels(viewerMemberId);
  const [mode, setMode] = useState<Mode>(
    startAdding && canAddNote ? { kind: "add" } : { kind: "idle" },
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Where focus goes when a form or the delete question closes without the page changing under it.
  const returnFocus = useRef<string | null>(null);

  useEffect(() => {
    // A form opens with its field focused, the delete question on *Keep it*; closing goes back.
    const target =
      mode.kind === "add"
        ? ADD_ID
        : mode.kind === "edit"
          ? editId(mode.noteId)
          : mode.kind === "delete"
            ? `care-note-keep-${mode.noteId}`
            : returnFocus.current;

    if (target) document.getElementById(target)?.focus();
    if (mode.kind === "idle") returnFocus.current = null;
  }, [mode]);

  if (notes.length === 0 && !canAddNote) return null;

  function open(next: Mode, from: string | null, text = "") {
    returnFocus.current = from;
    setDraft(text);
    setError(null);
    setMode(next);
  }

  function close() {
    setMode({ kind: "idle" });
    setError(null);
  }

  // The `?note=add` that opened the page must not open the form again on a refresh.
  function refresh() {
    if (startAdding) router.replace(`/care-log/${entryId}`, { scroll: false });
    else router.refresh();
  }

  function save() {
    if (!draft.trim()) {
      setError(t("textError"));

      return;
    }

    const current = mode;

    startTransition(async () => {
      const result =
        current.kind === "edit"
          ? await updateCareLogNoteAction(entryId, current.noteId, draft)
          : await addCareLogNoteAction(entryId, draft);

      if (result.ok) {
        showToast(t("saved"));
        close();
        refresh();
      } else {
        setError(result.code === "text" ? t("textError") : result.message);
      }
    });
  }

  function remove(noteId: number) {
    startTransition(async () => {
      const result = await deleteCareLogNoteAction(entryId, noteId);

      if (result.ok) {
        showToast(t("deleted"));
        close();
        refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function form(editing: boolean, id: string) {
    return (
      <div className="mt-1 flex flex-col gap-2">
        <TextField
          className="gap-1.5"
          isInvalid={error !== null}
          maxLength={MAX_TEXT}
          value={draft}
          onChange={(value) => {
            setDraft(value);
            setError(null);
          }}
        >
          <Label className="text-sm font-semibold text-heading">
            {t("yourNote")}
          </Label>
          {!editing && (
            <span className="text-[13.5px] text-muted">{t("addHint")}</span>
          )}
          <TextArea
            className="text-[15px] leading-[1.55]"
            id={id}
            placeholder={editing ? undefined : t("placeholder")}
            rows={4}
          />
        </TextField>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="min-w-[200px] flex-1 text-[13px] text-muted">
            {t("whoSees")}
          </span>
          <span className="text-[12.5px] tabular-nums text-subtle">
            {t("counter", { count: String(draft.length) })}
          </span>
        </span>
        {error && (
          <p className="text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}
        <span className="flex flex-wrap gap-2.5">
          <Button
            className="h-11 px-4 text-[14.5px] font-semibold max-md:flex-1"
            isPending={pending}
            variant="primary"
            onPress={save}
          >
            {t("save")}
          </Button>
          <Button
            className="h-11 px-4 text-[14.5px] font-semibold max-md:flex-1"
            isDisabled={pending}
            variant="outline"
            onPress={close}
          >
            {tCare("cancel")}
          </Button>
        </span>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="care-notes-title"
      className="flex flex-col gap-3 border-t border-separator pt-3.5"
    >
      <h2
        className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted"
        id="care-notes-title"
      >
        {t("head")}
      </h2>
      {notes.map((note) => {
        const editing = mode.kind === "edit" && mode.noteId === note.id;
        const deleting = mode.kind === "delete" && mode.noteId === note.id;

        return (
          <article
            key={note.id}
            className="flex gap-3 rounded-xl border border-separator bg-surface-secondary px-4 py-3.5"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-soft-foreground"
            >
              {initialsOf(note.author.name)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[14.5px] font-semibold text-heading">
                  {labels.name(note)}
                </span>
                <span className="text-[13px] text-subtle">
                  {labels.meta(note)}
                </span>
              </span>
              {editing ? (
                form(true, editId(note.id))
              ) : (
                <p className="max-w-[68ch] whitespace-pre-line text-pretty break-words text-[15.5px] leading-[1.6] text-foreground">
                  {note.text}
                </p>
              )}
              {deleting && (
                <div
                  aria-labelledby={`care-note-delete-${note.id}`}
                  className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[10px] bg-danger-soft px-3.5 py-3"
                  role="alertdialog"
                >
                  <span
                    className="min-w-[220px] flex-1 text-sm font-semibold text-danger-soft-foreground"
                    id={`care-note-delete-${note.id}`}
                  >
                    {t("deleteAsk")}
                  </span>
                  <Button
                    className="h-11 px-4 text-[14.5px] font-semibold max-md:flex-1"
                    isPending={pending}
                    variant="danger"
                    onPress={() => remove(note.id)}
                  >
                    {t("deleteConfirm")}
                  </Button>
                  <Button
                    className="h-11 px-4 text-[14.5px] font-semibold max-md:flex-1"
                    id={`care-note-keep-${note.id}`}
                    isDisabled={pending}
                    variant="outline"
                    onPress={close}
                  >
                    {t("keep")}
                  </Button>
                </div>
              )}
              {deleting && error && (
                <p className="text-[13px] text-danger" role="alert">
                  {error}
                </p>
              )}
              {note.canEdit && !editing && !deleting && (
                <span className="flex gap-5">
                  <button
                    aria-label={t("editAria")}
                    className="min-h-11 text-sm font-semibold text-link underline decoration-gold-500 underline-offset-4"
                    id={`${editId(note.id)}-button`}
                    type="button"
                    onClick={() =>
                      open(
                        { kind: "edit", noteId: note.id },
                        `${editId(note.id)}-button`,
                        note.text,
                      )
                    }
                  >
                    {tCare("edit")}
                  </button>
                  <button
                    aria-label={t("deleteAria")}
                    className="min-h-11 text-sm font-semibold text-danger"
                    id={`care-note-delete-button-${note.id}`}
                    type="button"
                    onClick={() =>
                      open(
                        { kind: "delete", noteId: note.id },
                        `care-note-delete-button-${note.id}`,
                      )
                    }
                  >
                    {tCare("entry.delete")}
                  </button>
                </span>
              )}
            </div>
          </article>
        );
      })}
      {mode.kind === "add" && (
        <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3.5">
          {form(false, ADD_ID)}
        </div>
      )}
      {canAddNote && mode.kind !== "add" && (
        <Button
          className="h-11 gap-2 self-start px-4 text-[14.5px] font-semibold"
          id="care-note-add-button"
          variant="outline"
          onPress={() => open({ kind: "add" }, "care-note-add-button")}
        >
          <PlusIcon
            aria-hidden="true"
            className="size-[17px]"
            strokeWidth={1.8}
          />
          {t("add")}
        </Button>
      )}
    </section>
  );
}
