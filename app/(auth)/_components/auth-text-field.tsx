"use client";

import type { ReactNode } from "react";

import { Description, InputGroup, TextField } from "@heroui/react";
import { Label } from "@heroui/react/label";

import { authInput, authInputGroup, authLabel } from "./auth-styles";

// Label + 46px input for the auth screens. `description` is a muted hint
// under the input, linked to it for screen readers.
export function AuthTextField({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  autoFocus,
  isRequired,
  isDisabled,
  description,
}: {
  label: string;
  type?: "text" | "email";
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  description?: ReactNode;
}) {
  return (
    <TextField
      className="gap-[7px]"
      isDisabled={isDisabled}
      isRequired={isRequired}
      type={type}
      value={value}
      onChange={onChange}
    >
      <Label className={authLabel}>{label}</Label>
      <InputGroup className={authInputGroup}>
        <InputGroup.Input
          autoComplete={autoComplete}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- callers opt in for the first field of a dedicated auth page
          autoFocus={autoFocus}
          className={authInput}
        />
      </InputGroup>
      {description && (
        <Description className="text-[13px]">{description}</Description>
      )}
    </TextField>
  );
}
