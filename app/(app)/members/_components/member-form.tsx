"use client";

import type { MemberActionFailure } from "@/app/(app)/members/_actions/member-actions";
import type {
  MemberErrorKey,
  MemberField,
  MemberFieldErrors,
  MemberFormValues,
} from "@/app/(app)/members/_lib/member-schema";
import type { PhoneParts } from "@/app/(app)/members/_lib/phone-countries";
import type { SubmitEvent } from "react";

import { useEffect, useRef, useState, useTransition } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import {
  Button,
  buttonVariants,
  Description,
  FieldError,
  InputGroup,
  TextField,
} from "@heroui/react";
import { Label } from "@heroui/react/label";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PhoneField } from "./phone-field";

import {
  createMemberAction,
  updateMemberAction,
} from "@/app/(app)/members/_actions/member-actions";
import {
  MEMBER_FIELDS,
  MIN_BIRTH_YEAR,
  memberSchema,
  toFieldErrors,
} from "@/app/(app)/members/_lib/member-schema";
import {
  composePhone,
  hasOnlyPhoneDigits,
  OTHER_COUNTRY,
  parsePhone,
} from "@/app/(app)/members/_lib/phone-countries";
import { card, title } from "@/components/primitives";

interface TextState {
  name: string;
  email: string;
  address: string;
  birthDate: string;
}

function todayIso(): string {
  const now = new Date();

  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

// Client-side check: the shared schema, plus the digits-only rule for the
// number part of the phone (only the form can tell it from the dial code).
function validate(
  values: MemberFormValues,
  phone: PhoneParts,
): MemberFieldErrors {
  const parsed = memberSchema.safeParse(values);
  const errors = parsed.success ? {} : toFieldErrors(parsed.error);

  if (
    phone.country !== OTHER_COUNTRY &&
    !hasOnlyPhoneDigits(phone.number) &&
    !errors.phone
  ) {
    errors.phone = "phoneDigitsOnly";
  }

  return errors;
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  help,
  required,
  disabled,
  type = "text",
  autoComplete,
  placeholder,
  className,
  min,
  max,
  errorText,
}: {
  label: string;
  name: MemberField;
  value: string;
  onChange: (value: string) => void;
  error?: MemberErrorKey;
  errorText?: string;
  help?: string;
  required?: boolean;
  disabled: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
}) {
  return (
    <TextField
      className={className ?? "gap-1.5"}
      isDisabled={disabled}
      isInvalid={Boolean(error)}
      isRequired={required}
      name={name}
      type={type}
      validationBehavior="aria"
      value={value}
      onChange={onChange}
    >
      <Label className="text-[13px] font-semibold text-heading">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-danger">
            {"*"}
          </span>
        )}
      </Label>
      <InputGroup className="h-10 w-full rounded-control">
        <InputGroup.Input
          autoComplete={autoComplete}
          className="text-sm sm:text-sm"
          max={max}
          min={min}
          placeholder={placeholder}
        />
      </InputGroup>
      {error ? (
        <FieldError className="flex items-center gap-1.5 text-[13px] text-danger">
          <ExclamationCircleIcon aria-hidden="true" className="size-4" />
          {errorText}
        </FieldError>
      ) : (
        help && (
          <Description className="text-[13px] text-muted">{help}</Description>
        )
      )}
    </TextField>
  );
}

/**
 * One form for `/members/new` and `/members/{id}/edit`. Pass `memberId` and
 * `initial` to edit: only the fields that changed are sent. Validation runs
 * on submit; a field with an error is re-checked as it changes.
 */
export function MemberForm({
  memberId,
  initial,
  cancelHref,
}: {
  memberId?: string;
  initial?: MemberFormValues;
  cancelHref: string;
}) {
  const t = useTranslations("MemberForm");
  const router = useRouter();
  const isEdit = memberId !== undefined;
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState<TextState>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    birthDate: initial?.birthDate ?? "",
  });
  const [initialPhone] = useState(() => parsePhone(initial?.phone ?? null));
  const [phone, setPhone] = useState<PhoneParts>(initialPhone);
  const [errors, setErrors] = useState<MemberFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const alertRef = useRef<HTMLDivElement>(null);
  const hasOther = initialPhone.country === OTHER_COUNTRY;
  const max = todayIso();

  useEffect(() => {
    if (failures > 0) alertRef.current?.focus();
  }, [failures]);

  function currentValues(
    nextText: TextState = text,
    nextPhone: PhoneParts = phone,
  ): MemberFormValues {
    return { ...nextText, phone: composePhone(nextPhone) };
  }

  // Re-check a field once it has shown an error; leave the others alone.
  function recheck(
    field: MemberField,
    values: MemberFormValues,
    p: PhoneParts,
  ) {
    if (!errors[field]) return;

    const next = validate(values, p)[field];

    setErrors((current) => ({ ...current, [field]: next }));
  }

  function setTextField(field: keyof TextState, value: string) {
    const nextText = { ...text, [field]: value };

    setText(nextText);
    recheck(field, currentValues(nextText), phone);
  }

  function changePhone(next: PhoneParts) {
    setPhone(next);
    recheck("phone", currentValues(text, next), next);
  }

  function fail(failure: MemberActionFailure) {
    setErrors(failure.fieldErrors ?? {});
    setFormError(failure.formError ?? null);
    setFailures((count) => count + 1);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const values = currentValues();
    const found = validate(values, phone);

    if (Object.keys(found).length > 0) {
      fail({ ok: false, fieldErrors: found });

      return;
    }

    setErrors({});
    setFormError(null);

    if (!isEdit) {
      startTransition(async () => {
        const failure = await createMemberAction(values);

        if (failure) fail(failure);
      });

      return;
    }

    const original: MemberFormValues = {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      address: initial?.address ?? "",
      birthDate: initial?.birthDate ?? "",
    };
    const changes: Partial<MemberFormValues> = {};

    for (const field of MEMBER_FIELDS) {
      if (values[field].trim() !== original[field].trim()) {
        changes[field] = values[field];
      }
    }

    if (Object.keys(changes).length === 0) {
      router.push(cancelHref);

      return;
    }

    startTransition(async () => {
      const failure = await updateMemberAction(memberId, changes);

      if (failure) fail(failure);
    });
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const errorOf = (field: MemberField) =>
    errors[field] ? t(`errors.${errors[field]}`) : undefined;

  return (
    <form
      noValidate
      className={card({ className: "max-w-[780px] overflow-hidden p-0" })}
      onSubmit={handleSubmit}
    >
      {failures > 0 && (errorCount > 0 || formError) && (
        <div
          ref={alertRef}
          className="m-6 mb-0 flex items-start gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-danger-soft-foreground outline-none focus-visible:shadow-[var(--shadow-focus)]"
          role="alert"
          tabIndex={-1}
        >
          <ExclamationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          <div className="flex flex-col gap-0.5 text-sm">
            <strong className="font-semibold">{t("alertTitle")}</strong>
            <span>{formError ?? t("alertBody", { count: errorCount })}</span>
          </div>
        </div>
      )}

      <fieldset className="m-0 flex min-w-0 flex-col gap-5 border-0 p-6">
        <legend className="mb-1 w-full p-0">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("contactEyebrow")}
          </span>
          <span
            className={title({ size: "sm", className: "block text-[22px]" })}
          >
            {t("contactTitle")}
          </span>
        </legend>
        <Field
          required
          autoComplete="name"
          disabled={isPending}
          error={errors.name}
          errorText={errorOf("name")}
          label={t("name")}
          name="name"
          value={text.name}
          onChange={(v) => setTextField("name", v)}
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          <Field
            autoComplete="email"
            disabled={isPending}
            error={errors.email}
            errorText={errorOf("email")}
            help={t("emailHelp")}
            label={t("email")}
            name="email"
            type="email"
            value={text.email}
            onChange={(v) => setTextField("email", v)}
          />
          <PhoneField
            error={errorOf("phone")}
            hasOther={hasOther}
            isDisabled={isPending}
            value={phone}
            onChange={changePhone}
          />
        </div>
      </fieldset>

      <fieldset className="m-0 flex min-w-0 flex-col gap-5 border-0 border-t border-separator p-6">
        <legend className="mb-1 w-full p-0">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("personalEyebrow")}
          </span>
          <span
            className={title({ size: "sm", className: "block text-[22px]" })}
          >
            {t("personalTitle")}
          </span>
        </legend>
        <Field
          autoComplete="street-address"
          disabled={isPending}
          error={errors.address}
          errorText={errorOf("address")}
          label={t("address")}
          name="address"
          placeholder={t("addressPlaceholder")}
          value={text.address}
          onChange={(v) => setTextField("address", v)}
        />
        <Field
          autoComplete="bday"
          className="w-full gap-1.5 sm:w-1/2"
          disabled={isPending}
          error={errors.birthDate}
          errorText={errorOf("birthDate")}
          help={t("birthDateHelp")}
          label={t("birthDate")}
          max={max}
          min={`${MIN_BIRTH_YEAR}-01-01`}
          name="birthDate"
          type="date"
          value={text.birthDate}
          onChange={(v) => setTextField("birthDate", v)}
        />
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator bg-surface-secondary/50 px-6 py-4">
        <p className="text-[13px] text-muted">
          <span aria-hidden="true" className="text-danger">
            {"*"}
          </span>{" "}
          {t("required")}
        </p>
        <div className="flex flex-wrap gap-3">
          <NextLink
            aria-disabled={isPending}
            className={buttonVariants({
              variant: "outline",
              className: "font-semibold text-heading",
            })}
            href={cancelHref}
          >
            {t("cancel")}
          </NextLink>
          <Button className="font-semibold" isPending={isPending} type="submit">
            {isEdit ? t("save") : t("add")}
          </Button>
        </div>
      </div>
    </form>
  );
}
