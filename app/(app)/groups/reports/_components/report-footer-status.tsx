"use client";

import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

/**
 * The left side of the list step's footer: the save error (with **Reload people** when the roster
 * changed under the leader) above the "mark the N remaining people" hint.
 */
export function ReportFooterStatus({
  remaining,
  failure,
  reloading,
  onReload,
}: {
  remaining: number;
  failure: { message: string; kind?: string } | null;
  reloading: boolean;
  onReload: () => void;
}) {
  const t = useTranslations("ReportForm");

  return (
    <div className="flex min-w-0 flex-1 basis-[240px] flex-col gap-2">
      {failure && (
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground"
          role="alert"
        >
          <ExclamationCircleIcon
            aria-hidden="true"
            className="size-5 shrink-0"
          />
          <span className="min-w-0 flex-1">{failure.message}</span>
          {failure.kind === "rosterChanged" && (
            <Button
              isPending={reloading}
              size="sm"
              variant="outline"
              onPress={onReload}
            >
              {t("reloadPeople")}
            </Button>
          )}
        </div>
      )}
      <p
        className={
          remaining > 0
            ? "text-[13px] font-semibold text-warning-soft-foreground"
            : "text-[13px] text-muted"
        }
      >
        {remaining > 0 ? t("remaining", { count: remaining }) : t("allMarked")}
      </p>
    </div>
  );
}
