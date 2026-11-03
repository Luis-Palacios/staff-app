"use client";

import type { ComponentType, SVGProps } from "react";

import { AlertDialog, Button } from "@heroui/react";
import clsx from "clsx";

import { title as titleClass } from "@/components/primitives";

/**
 * The editor's confirms (`Draft-Submit`, `Draft-Discard`, `Draft-NoMeeting`): an icon tile, a
 * title and what happens, optional summary tiles, then the safe button and the action. Centred,
 * 500 px, on desktop; a bottom sheet on phones with the buttons stacked, the action on top. Focus
 * starts on the safe button; Escape closes, and focus returns to the trigger.
 */
export function ReportConfirmDialog({
  isOpen,
  onOpenChange,
  icon: Icon,
  tone,
  title,
  body,
  summary,
  cancelLabel,
  confirmLabel,
  isPending = false,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** `danger` deletes something: red tile and button. */
  tone: "accent" | "danger";
  title: string;
  body: string;
  summary?: { value: string; label: string }[];
  cancelLabel: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Backdrop
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <AlertDialog.Container placement="auto" size="lg">
        <AlertDialog.Dialog className="gap-[18px] sm:max-w-[500px]">
          <AlertDialog.Header className="flex-row items-start gap-3.5">
            <span
              aria-hidden="true"
              className={clsx(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                tone === "danger"
                  ? "bg-danger-soft text-danger-soft-foreground"
                  : "bg-accent-soft text-accent-soft-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={1.7} />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <AlertDialog.Heading
                className={titleClass({
                  size: "sm",
                  className: "text-2xl leading-tight",
                })}
              >
                {title}
              </AlertDialog.Heading>
              <p className="text-[14.5px] font-normal leading-relaxed text-foreground">
                {body}
              </p>
            </div>
          </AlertDialog.Header>
          {summary && (
            <AlertDialog.Body className="overflow-visible p-0">
              <ul className="grid grid-cols-3 gap-2 rounded-xl border border-separator bg-surface-secondary px-3.5 py-3">
                {summary.map((tile) => (
                  <li key={tile.label} className="flex flex-col gap-0.5">
                    <span className="text-xl font-semibold text-heading tabular-nums">
                      {tile.value}
                    </span>
                    <span className="text-[12.5px] text-muted">
                      {tile.label}
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDialog.Body>
          )}
          <AlertDialog.Footer className="flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              // The safe choice takes focus first (Keep editing, Keep draft).
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              className="h-12 w-full font-semibold sm:w-auto"
              isDisabled={isPending}
              slot="close"
              variant="outline"
            >
              {cancelLabel}
            </Button>
            <Button
              className="h-12 w-full px-5 font-semibold sm:w-auto"
              isPending={isPending}
              variant={tone === "danger" ? "danger" : "primary"}
              onPress={onConfirm}
            >
              {confirmLabel}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
