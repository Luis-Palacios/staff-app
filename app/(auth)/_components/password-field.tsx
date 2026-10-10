"use client";

import type { ReactNode } from "react";

import { useState } from "react";
import { Button, InputGroup, TextField } from "@heroui/react";
import { Label } from "@heroui/react/label";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import { authInput, authInputGroup, authLabel } from "./auth-styles";

// Shared across every (auth) page that collects a password (sign-in, sign-up,
// reset-password's new/confirm pair) so the show/hide toggle is only built
// once. `labelAction` sits at the right of the label row (sign-in's
// "Forgot password?" link).
export function PasswordField({
  label,
  labelAction,
  value,
  onChange,
  isDisabled,
  isRequired,
  autoComplete,
}: {
  label: string;
  labelAction?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  isRequired?: boolean;
  autoComplete?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      className="gap-[7px]"
      isDisabled={isDisabled}
      isRequired={isRequired}
      value={value}
      onChange={onChange}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Label className={authLabel}>{label}</Label>
        {labelAction}
      </div>
      <InputGroup className={authInputGroup}>
        <InputGroup.Input
          autoComplete={autoComplete}
          className={authInput}
          type={isVisible ? "text" : "password"}
        />
        <InputGroup.Suffix className="border-0 pr-1.5 pl-0">
          <Button
            isIconOnly
            aria-label={isVisible ? "Hide password" : "Show password"}
            className="size-9 text-muted md:size-9"
            size="sm"
            variant="ghost"
            onPress={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? (
              <EyeSlashIcon className="size-[18px]" strokeWidth={1.7} />
            ) : (
              <EyeIcon className="size-[18px]" strokeWidth={1.7} />
            )}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );
}
