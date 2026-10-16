"use client";

import type { Key } from "react";

import { useId } from "react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

// The segmented treatment from StatusTabs / ThemeSwitch, sized to fill half of
// a 40px group so it lines up with the Birth date input next to it.
const segmentButton = clsx(
  "h-[34px] w-full min-w-0 justify-center rounded-[7px] px-3.5 text-sm font-semibold",
  "[--toggle-button-bg:transparent] [--toggle-button-bg-hover:transparent] [--toggle-button-bg-pressed:transparent]",
  "[--toggle-button-fg:var(--muted)] hover:[--toggle-button-fg:var(--foreground)]",
  "[--toggle-button-bg-selected:var(--segment-selected)] [--toggle-button-bg-selected-hover:var(--segment-selected)] [--toggle-button-bg-selected-pressed:var(--segment-selected)]",
  "[--toggle-button-fg-selected:var(--heading)] data-[selected=true]:shadow-segment",
);

const OPTIONS = ["male", "female"] as const;

/**
 * Optional Male / Female choice. `value` is "" when nothing is picked;
 * clicking the selected option clears it.
 */
export function SexField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("MemberForm");
  const labelId = useId();
  const helpId = useId();
  const labels = { male: t("sexMale"), female: t("sexFemale") };

  const handleSelectionChange = (keys: Set<Key>) => {
    const [next] = keys;

    onChange(typeof next === "string" ? next : "");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-heading" id={labelId}>
        {t("sex")}
      </span>
      <ToggleButtonGroup
        aria-describedby={helpId}
        aria-labelledby={labelId}
        className="grid h-10 w-full grid-cols-2 gap-0.5 rounded-control border border-border bg-segment p-[3px]"
        isDisabled={disabled}
        selectedKeys={value ? [value] : []}
        selectionMode="single"
        onSelectionChange={handleSelectionChange}
      >
        {OPTIONS.map((key) => (
          <ToggleButton key={key} className={segmentButton} id={key}>
            {labels[key]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <p className="text-[13px] text-muted" id={helpId}>
        {t("sexHelp")}
      </p>
    </div>
  );
}
