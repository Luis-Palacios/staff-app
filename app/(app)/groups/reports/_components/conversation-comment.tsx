"use client";

import type { ConversationComment as Comment } from "@/api/conversations-api/types";

import { useState } from "react";
import { Button, Dropdown } from "@heroui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { initialsOf } from "@/components/initials-avatar";

export interface CommentView {
  comment: Comment;
  /** "Elder", "Leader" or "Co-leader". */
  role: string;
  /** Already formatted in the church's time zone. */
  when: string;
  /** Already formatted: the stub shows only the date. */
  deletedWhen: string;
}

// One comment: avatar by side, name, role, time, "· edited" and, for your own, a ⋯ menu with Edit
// and Delete (the delete asks right in the comment, no dialog). A deleted one is the dashed stub.
export function ConversationComment({
  view,
  busy,
  onSave,
  onDelete,
}: {
  view: CommentView;
  busy: boolean;
  onSave: (commentId: number, body: string) => void;
  onDelete: (commentId: number) => void;
}) {
  const t = useTranslations("Conversations");
  const { comment } = view;
  const [mode, setMode] = useState<"view" | "edit" | "confirmDelete">("view");
  const [draft, setDraft] = useState(comment.body ?? "");

  if (comment.deleted) {
    return (
      <div className="flex items-center gap-3 px-5 py-2">
        <span
          aria-hidden="true"
          className="size-[34px] shrink-0 rounded-full border-[1.5px] border-dashed border-separator"
        />
        <span className="text-[13.5px] italic text-muted">
          {t("deletedStub", { date: view.deletedWhen })}
        </span>
      </div>
    );
  }

  const elder = comment.author.side === "elders";
  const canSave = draft.trim().length > 0 && draft.trim().length <= 4000;

  return (
    <article className="flex gap-3 px-5 py-3">
      <span
        aria-hidden="true"
        className={clsx(
          "flex size-[34px] shrink-0 items-center justify-center rounded-full text-xs font-bold",
          elder
            ? "bg-warning-soft text-warning-soft-foreground"
            : "bg-accent-soft text-accent-soft-foreground",
        )}
      >
        {initialsOf(comment.author.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-heading">
              {comment.author.name}
            </span>
            <span
              className={clsx(
                "text-xs font-semibold",
                elder ? "text-warning-soft-foreground" : "text-muted",
              )}
            >
              {view.role}
            </span>
            <span className="text-[12.5px] text-muted">{view.when}</span>
            {comment.editedAt && (
              <span className="text-[12.5px] text-muted">
                {"· "}
                {t("edited")}
              </span>
            )}
          </span>
          {comment.mine && mode === "view" && (
            <Dropdown.Root>
              <Dropdown.Trigger
                aria-label={t("commentOptions")}
                className="-mr-2 -mt-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-secondary hover:text-heading aria-expanded:bg-surface-secondary data-pressed:transform-none"
                isDisabled={busy}
              >
                <EllipsisHorizontalIcon
                  aria-hidden="true"
                  className="size-[18px]"
                  strokeWidth={1.8}
                />
              </Dropdown.Trigger>
              <Dropdown.Popover
                className="w-[180px] rounded-[14px] border border-overlay-border bg-surface p-1.5 shadow-overlay-menu"
                offset={6}
                placement="bottom end"
              >
                <Dropdown.Menu
                  aria-label={t("commentOptions")}
                  className="gap-0.5 p-0"
                >
                  <Dropdown.Item
                    className="h-10 min-h-0 rounded-[10px] px-2.5 py-0 text-sm font-medium text-heading data-focused:bg-surface-secondary data-hovered:bg-surface-secondary"
                    textValue={t("edit")}
                    onAction={() => {
                      setDraft(comment.body ?? "");
                      setMode("edit");
                    }}
                  >
                    {t("edit")}
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="h-10 min-h-0 rounded-[10px] px-2.5 py-0 text-sm font-medium text-danger data-focused:bg-danger-soft data-hovered:bg-danger-soft"
                    textValue={t("delete")}
                    variant="danger"
                    onAction={() => setMode("confirmDelete")}
                  >
                    {t("delete")}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.Root>
          )}
        </div>

        {mode === "edit" ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();

              if (!canSave) return;

              onSave(comment.id, draft);
              setMode("view");
            }}
          >
            <textarea
              aria-label={t("edit")}
              className="min-h-[88px] w-full resize-y rounded-[10px] border-[1.5px] border-field-border bg-field-background px-3 py-2.5 text-[14.5px] leading-normal text-field-foreground"
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                className="h-9 font-semibold"
                isDisabled={!canSave}
                type="submit"
                variant="primary"
              >
                {t("save")}
              </Button>
              <Button
                className="h-9 font-semibold"
                variant="outline"
                onPress={() => setMode("view")}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-line text-pretty text-[14.5px] leading-normal text-foreground">
            {comment.body}
          </p>
        )}

        {mode === "confirmDelete" && (
          <div
            className="mt-1 flex flex-wrap items-center gap-2 rounded-tile bg-danger-soft px-3 py-2"
            role="group"
          >
            <span className="flex-1 text-[13.5px] font-semibold text-danger-soft-foreground">
              {t("confirmDelete")}
            </span>
            <Button
              className="h-8 font-semibold"
              variant="danger"
              onPress={() => {
                onDelete(comment.id);
                setMode("view");
              }}
            >
              {t("delete")}
            </Button>
            <Button
              className="h-8 font-semibold"
              variant="outline"
              onPress={() => setMode("view")}
            >
              {t("cancel")}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
