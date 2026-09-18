"use client";

import { useState } from "react";
import { Button, InputGroup, TextField } from "@heroui/react";
import { Label } from "@heroui/react/label";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// Shared across every (auth) page that collects a password (sign-in, sign-up,
// reset-password's new/confirm pair) so the show/hide toggle is only built once.
export function PasswordField({
  label,
  value,
  onChange,
  isDisabled,
  isRequired,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
  isRequired?: boolean;
  autoComplete?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      isDisabled={isDisabled}
      isRequired={isRequired}
      value={value}
      onChange={onChange}
    >
      <Label className="text-base">{label}</Label>
      <InputGroup>
        <InputGroup.Input
          autoComplete={autoComplete}
          className="text-base"
          type={isVisible ? "text" : "password"}
        />
        <InputGroup.Suffix>
          <Button
            isIconOnly
            aria-label={isVisible ? "Hide password" : "Show password"}
            size="sm"
            variant="ghost"
            onPress={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? (
              <EyeSlashIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </TextField>
  );
}
