"use client";

import type { GuestActionFailure } from "@/app/(app)/guests/_actions/guest-actions";
import type {
  GuestErrorKey,
  GuestField,
  GuestFieldErrors,
  GuestFormValues,
} from "@/app/(app)/guests/_lib/guest-schema";
import type { PhoneParts } from "@/app/(app)/members/_lib/phone-countries";
import type { Key, SubmitEvent } from "react";

import { useEffect, useRef, useState, useTransition } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import {
  Button,
  buttonVariants,
  Description,
  FieldError,
  InputGroup,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { Label } from "@heroui/react/label";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { InvitedByField } from "./invited-by-field";
import { SimilarGuests } from "./similar-guests";

import {
  createGuestAction,
  updateGuestAction,
} from "@/app/(app)/guests/_actions/guest-actions";
import {
  GUEST_FIELDS,
  guestSchema,
  toGuestFieldErrors,
} from "@/app/(app)/guests/_lib/guest-schema";
import { GuestDatePicker } from "@/app/(app)/groups/[id]/_components/guest-date-picker";
import { PhoneField } from "@/app/(app)/members/_components/phone-field";
import { SexField } from "@/app/(app)/members/_components/sex-field";
import {
  composePhone,
  hasOnlyPhoneDigits,
  OTHER_COUNTRY,
  parsePhone,
} from "@/app/(app)/members/_lib/phone-countries";
import { card, title } from "@/components/primitives";

const NO_GROUP = "__none__";

export interface GuestFormGroup {
  id: number;
  name: string;
}

interface TextState {
  name: string;
  email: string;
  address: string;
  sex: string;
}

function validate(
  values: GuestFormValues,
  phone: PhoneParts,
): GuestFieldErrors {
  const parsed = guestSchema.safeParse(values);
  const errors = parsed.success ? {} : toGuestFieldErrors(parsed.error);

  if (
    phone.country !== OTHER_COUNTRY &&
    !hasOnlyPhoneDigits(phone.number) &&
    !errors.phone
  ) {
    errors.phone = "phoneDigitsOnly";
  }

  return errors;
}

function TextInput({
  label,
  name,
  value,
  onChange,
  error,
  errorText,
  required,
  disabled,
  type = "text",
  autoComplete,
  placeholder,
  help,
}: {
  label: string;
  name: GuestField;
  value: string;
  onChange: (value: string) => void;
  error?: GuestErrorKey;
  errorText?: string;
  required?: boolean;
  disabled: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  help?: string;
}) {
  return (
    <TextField
      className="gap-1.5"
      isDisabled={disabled}
      isInvalid={Boolean(error)}
      isRequired={required}
      name={name}
      type={type}
      validationBehavior="aria"
      value={value}
      onChange={onChange}
    >
      <Label className="text-[13px] font-semibold text-heading">{label}</Label>
      <InputGroup className="h-10 w-full rounded-control">
        <InputGroup.Input
          autoComplete={autoComplete}
          className="text-sm sm:text-sm"
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
 * One form for `/guests/new` and `/guests/{id}/edit`. Pass `guestId` and `initial` to edit: only
 * the fields that changed are sent, and the group is never shown (it is changed from the group's
 * page). Validation runs on submit; a field with an error is re-checked as it changes.
 */
export function GuestForm({
  guestId,
  initial,
  initialInvitedBy = null,
  today,
  cancelHref,
  groups = [],
  canOpenGuests,
}: {
  guestId?: string;
  initial?: GuestFormValues;
  initialInvitedBy?: { id: number; name: string } | null;
  /** Today at the church: the latest first-visit date. */
  today: string;
  cancelHref: string;
  /** New only: open guest groups the caller may add to; empty hides the select. */
  groups?: GuestFormGroup[];
  /** Similar guests link to their page when the viewer can open them. */
  canOpenGuests: boolean;
}) {
  const t = useTranslations("GuestForm");
  const router = useRouter();
  const isEdit = guestId !== undefined;
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState<TextState>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    sex: initial?.sex ?? "",
  });
  const [initialPhone] = useState(() => parsePhone(initial?.phone ?? null));
  const [phone, setPhone] = useState<PhoneParts>(initialPhone);
  const [firstVisit, setFirstVisit] = useState(
    initial?.firstVisitDate || today,
  );
  const [firstVisitTouched, setFirstVisitTouched] = useState(false);
  const [invitedBy, setInvitedBy] = useState(initialInvitedBy);
  const [invitedByTouched, setInvitedByTouched] = useState(false);
  const [invitedByUnavailable, setInvitedByUnavailable] = useState(false);
  const [groupKey, setGroupKey] = useState(NO_GROUP);
  const [errors, setErrors] = useState<GuestFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const alertRef = useRef<HTMLDivElement>(null);
  const hasOther = initialPhone.country === OTHER_COUNTRY;

  useEffect(() => {
    if (failures > 0) alertRef.current?.focus();
  }, [failures]);

  function currentValues(
    nextText: TextState = text,
    nextPhone: PhoneParts = phone,
  ): GuestFormValues {
    return {
      ...nextText,
      phone: composePhone(nextPhone),
      firstVisitDate: firstVisit,
    };
  }

  function recheck(field: GuestField, values: GuestFormValues, p: PhoneParts) {
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

  function fail(failure: GuestActionFailure) {
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
        const failure = await createGuestAction(
          values,
          invitedBy?.id ?? null,
          groupKey === NO_GROUP ? null : Number(groupKey),
        );

        if (failure) fail(failure);
      });

      return;
    }

    const original: GuestFormValues = {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      address: initial?.address ?? "",
      sex: initial?.sex ?? "",
      firstVisitDate: initial?.firstVisitDate ?? "",
    };
    const changes: Partial<GuestFormValues> = {};

    for (const field of GUEST_FIELDS) {
      // A first visit that was never recorded isn't invented by saving the form.
      if (field === "firstVisitDate" && !firstVisitTouched) continue;

      if (values[field].trim() !== original[field].trim()) {
        changes[field] = values[field];
      }
    }

    const invitedByChanged =
      invitedByTouched &&
      !invitedByUnavailable &&
      (invitedBy?.id ?? null) !== (initialInvitedBy?.id ?? null);

    if (Object.keys(changes).length === 0 && !invitedByChanged) {
      router.push(cancelHref);

      return;
    }

    startTransition(async () => {
      const failure = await updateGuestAction(
        guestId,
        changes,
        invitedByChanged ? (invitedBy?.id ?? null) : undefined,
      );

      if (failure) fail(failure);
    });
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const errorOf = (field: GuestField) =>
    errors[field] ? t(`errors.${errors[field]}`) : undefined;

  return (
    <form
      noValidate
      className={card({ className: "max-w-[780px] overflow-hidden p-0" })}
      onSubmit={handleSubmit}
    >
      <SimilarGuests
        canOpen={canOpenGuests}
        excludeId={isEdit ? Number(guestId) : undefined}
        name={text.name.trim()}
        phone={phone.number.trim() ? composePhone(phone) : ""}
      />

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

      <fieldset className="m-0 flex min-w-0 flex-col gap-5 border-0 px-6 pb-6 pt-0">
        <legend className="mb-1 w-full px-0 pb-0 pt-6">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("contactEyebrow")}
          </span>
          <span
            className={title({ size: "sm", className: "block text-[22px]" })}
          >
            {t("contactTitle")}
          </span>
        </legend>
        <TextInput
          required
          autoComplete="off"
          disabled={isPending}
          error={errors.name}
          errorText={errorOf("name")}
          label={t("name")}
          name="name"
          value={text.name}
          onChange={(v) => setTextField("name", v)}
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          <PhoneField
            error={errorOf("phone")}
            hasOther={hasOther}
            isDisabled={isPending}
            value={phone}
            onChange={changePhone}
          />
          <TextInput
            autoComplete="off"
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
        </div>
      </fieldset>

      <div className="border-t border-separator" />

      <fieldset className="m-0 flex min-w-0 flex-col gap-5 border-0 px-6 pb-6 pt-0">
        <legend className="mb-1 w-full px-0 pb-0 pt-6">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("personalEyebrow")}
          </span>
          <span
            className={title({ size: "sm", className: "block text-[22px]" })}
          >
            {t("personalTitle")}
          </span>
        </legend>
        <TextInput
          autoComplete="off"
          disabled={isPending}
          error={errors.address}
          errorText={errorOf("address")}
          label={t("address")}
          name="address"
          placeholder={t("addressPlaceholder")}
          value={text.address}
          onChange={(v) => setTextField("address", v)}
        />
        <SexField
          disabled={isPending}
          value={text.sex}
          onChange={(v) => setTextField("sex", v)}
        />
      </fieldset>

      <div className="border-t border-separator" />

      <fieldset className="m-0 flex min-w-0 flex-col gap-5 border-0 px-6 pb-6 pt-0">
        <legend className="mb-1 w-full px-0 pb-0 pt-6">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("originEyebrow")}
          </span>
          <span
            className={title({ size: "sm", className: "block text-[22px]" })}
          >
            {t("originTitle")}
          </span>
        </legend>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <GuestDatePicker
            isDisabled={isPending}
            label={t("firstVisit")}
            max={today}
            value={firstVisit}
            onChange={(value) => {
              setFirstVisit(value);
              setFirstVisitTouched(true);
            }}
          />
          <InvitedByField
            isDisabled={isPending}
            value={invitedBy}
            onChange={(member) => {
              setInvitedBy(member);
              setInvitedByTouched(true);
            }}
            onUnavailable={() => setInvitedByUnavailable(true)}
          />
        </div>
        {!isEdit && groups.length > 0 && (
          <Select.Root
            className="w-full gap-1.5"
            isDisabled={isPending}
            selectedKey={groupKey}
            onSelectionChange={(key: Key | null) =>
              setGroupKey(key === null ? NO_GROUP : String(key))
            }
          >
            <Label className="text-[13px] font-semibold text-heading">
              {t("group")}
            </Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={NO_GROUP} textValue={t("noGroup")}>
                  {t("noGroup")}
                </ListBox.Item>
                {groups.map((group) => (
                  <ListBox.Item
                    key={group.id}
                    id={String(group.id)}
                    textValue={group.name}
                  >
                    {group.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <Description className="text-[13px] text-muted">
              {t("groupHelp")}
            </Description>
          </Select.Root>
        )}
        {isEdit && (
          <p className="text-[13px] text-muted">{t("groupEditNote")}</p>
        )}
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
