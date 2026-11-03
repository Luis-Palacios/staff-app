"use client";

import type { ComponentType, SVGProps } from "react";

import { Button } from "@heroui/react";
import clsx from "clsx";

const TONE = {
  danger: "bg-danger-soft text-danger-soft-foreground",
  warning: "bg-warning-soft text-warning-soft-foreground",
  accent: "bg-accent-soft text-accent-soft-foreground",
} as const;

/**
 * The one notice above the editor's content (conflict, error, offline, roster changed, resumed):
 * an icon, a bold title and a sentence, and an action for the first two. Conflict and error are
 * `role="alert"`; the others are polite.
 */
export function ReportBanner({
  tone,
  icon: Icon,
  title,
  body,
  alert = false,
  action,
  className,
}: {
  tone: keyof typeof TONE;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
  alert?: boolean;
  action?: { label: string; onPress: () => void };
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex w-full flex-wrap items-start gap-x-3.5 gap-y-2.5 rounded-[14px] px-4 py-3.5 text-sm leading-normal",
        TONE[tone],
        className,
      )}
      role={alert ? "alert" : "status"}
    >
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-[18px] shrink-0"
        strokeWidth={1.8}
      />
      <p className="min-w-0 flex-[1_1_240px]">
        <strong className="font-semibold">{title}</strong> {body}
      </p>
      {action && (
        <Button
          className="shrink-0 border-current bg-surface font-semibold text-heading"
          variant="outline"
          onPress={action.onPress}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
