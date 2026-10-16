"use client";

import { Description, Label, TextArea, TextField } from "@heroui/react";
import { useTranslations } from "next-intl";

import { TEXT_MAX } from "@/app/(app)/groups/reports/_lib/report-schema";

export type GroupTextField = "prayer" | "praise" | "discussion";

export const GROUP_TEXT_FIELDS: readonly GroupTextField[] = [
  "prayer",
  "praise",
  "discussion",
];

/**
 * The three things the group shares (prayer requests, praise, points for the elders): a labelled
 * textarea each, with a hint and a "n / 1024" counter. Used by the group step (one column, tall)
 * and by the list step (a grid, compact).
 */
export function GroupFields({
  values,
  onChange,
  layout,
}: {
  values: Record<GroupTextField, string>;
  onChange: (field: GroupTextField, value: string) => void;
  layout: "stacked" | "grid";
}) {
  const t = useTranslations("ReportForm");

  return (
    <div
      className={
        layout === "grid" ? "grid gap-4 md:grid-cols-3" : "flex flex-col gap-5"
      }
    >
      {GROUP_TEXT_FIELDS.map((field) => (
        <TextField
          key={field}
          className="gap-1.5"
          maxLength={TEXT_MAX}
          name={field}
          value={values[field]}
          onChange={(value) => onChange(field, value)}
        >
          <Label className="text-[13px] font-semibold text-heading md:flex md:min-h-9 md:items-end">
            {t(field)}{" "}
            <span className="font-normal text-muted">{t("optional")}</span>
          </Label>
          <TextArea className="text-sm" rows={layout === "grid" ? 5 : 4} />
          <div className="flex items-start justify-between gap-3">
            <Description className="text-[13px] text-muted">
              {t(`${field}Hint`)}
            </Description>
            <span className="shrink-0 text-[13px] text-muted tabular-nums">
              {t("counter", { count: values[field].length })}
            </span>
          </div>
        </TextField>
      ))}
    </div>
  );
}
