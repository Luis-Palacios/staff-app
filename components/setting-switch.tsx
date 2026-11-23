// No "use client": only client components import this (it takes a callback), so it runs in their
// bundle; a client entry here would flag `onChange` as an unserializable prop.

import type { ToggleResult } from "@/app/(app)/_actions/notification-actions";
import type { ReactNode } from "react";

import { Description, Label, Switch } from "@heroui/react";
import { useState, useTransition } from "react";

/**
 * A switch that saves on toggle: the new value shows at once, a failed save puts the old one back
 * with the error under the switch. A new `value` from the server (after a revalidate) wins. While a
 * save runs, further toggles wait for it, so two saves never race.
 */
export function useSavedToggle(
  value: boolean,
  save: (next: boolean) => Promise<ToggleResult>,
) {
  const [shown, setShown] = useState(value);
  const [synced, setSynced] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (value !== synced) {
    setSynced(value);
    setShown(value);
  }

  function toggle(next: boolean) {
    if (pending) return;

    const previous = shown;

    setShown(next);
    setError(null);
    startTransition(async () => {
      const result = await save(next);

      if (result.ok) {
        setShown(result.value);
      } else {
        setShown(previous);
        setError(result.message);
      }
    });
  }

  return { isSelected: shown, pending, error, toggle };
}

export function SettingSwitch({
  label,
  badge,
  description,
  note,
  isSelected,
  isDisabled = false,
  pending = false,
  error,
  onChange,
}: {
  label: string;
  /** Shown after the label, e.g. a `StatusBadge`. */
  badge?: ReactNode;
  description?: ReactNode;
  /** Text under the switch that stays readable while it's disabled (HeroUI dims `description`),
   *  e.g. why it's disabled and where to change that. */
  note?: ReactNode;
  isSelected: boolean;
  isDisabled?: boolean;
  pending?: boolean;
  error?: string | null;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Switch
        aria-busy={pending || undefined}
        isDisabled={isDisabled}
        isSelected={isSelected}
        onChange={onChange}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Label className="text-[15px] font-medium text-heading">
            {label}
          </Label>
          {badge}
        </Switch.Content>
        {description && (
          <Description className="text-[13.5px] text-muted">
            {description}
          </Description>
        )}
      </Switch>
      {note && (
        <p className="ps-[calc(2.5rem+0.75rem)] text-[13.5px] text-muted">
          {note}
        </p>
      )}
      {error && (
        <p
          className="ps-[calc(2.5rem+0.75rem)] text-[13px] text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
