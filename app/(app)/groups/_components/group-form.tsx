"use client";

import type { GroupAudience, Weekday } from "@/api/small-groups-api/types";
import type { GroupFormFailure } from "@/app/(app)/groups/_actions/group-actions";
import type {
  GroupErrorKey,
  GroupField,
  GroupFieldErrors,
  GroupFormValues,
} from "@/app/(app)/groups/_lib/group-schema";
import type { SubmitEvent } from "react";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ExclamationCircleIcon,
  HandRaisedIcon,
  InformationCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  buttonVariants,
  Description,
  FieldError,
  InputGroup,
  TextField,
} from "@heroui/react";
import { Label } from "@heroui/react/label";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createGroupAction,
  updateGroupAction,
} from "@/app/(app)/groups/_actions/group-actions";
import {
  GROUP_FIELDS,
  groupSchema,
  toFieldErrors,
  WEEKDAYS,
} from "@/app/(app)/groups/_lib/group-schema";
import { card, title } from "@/components/primitives";
import { WEEKDAY_KEYS } from "@/lib/weekdays";

// Single-select chips as a real radio group: native radios give arrow-key
// movement and a single tab stop, and the chip is the label's styling.
function DayPicker({
  value,
  onChange,
  disabled,
}: {
  value: Weekday | null;
  onChange: (value: Weekday | null) => void;
  disabled: boolean;
}) {
  const t = useTranslations("GroupForm");
  const tDay = useTranslations("Weekdays");
  const options: { day: Weekday | null; label: string; name: string }[] = [
    { day: null, label: t("dayNotSet"), name: t("dayNotSet") },
    ...WEEKDAYS.map((day) => ({
      day,
      label: t(`days.${WEEKDAY_KEYS[day]}`),
      name: tDay(WEEKDAY_KEYS[day]),
    })),
  ];

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
      <legend className="mb-1.5 p-0 text-[13px] font-semibold text-heading">
        {t("meetingDay")}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ day, label, name }) => (
          <label key={label} className="relative">
            <input
              aria-label={name}
              checked={value === day}
              className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              disabled={disabled}
              name="meetingDay"
              type="radio"
              onChange={() => onChange(day)}
            />
            <span
              aria-hidden="true"
              className={clsx(
                "flex h-10 min-w-12 items-center justify-center rounded-[10px] border px-3.5 text-sm font-semibold transition-colors",
                "border-field-border bg-field-background text-foreground peer-hover:border-accent",
                "peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground",
                "peer-focus-visible:shadow-[var(--shadow-focus)] peer-disabled:opacity-60",
              )}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
      <p className="text-[13px] text-muted">{t("meetingDayHelp")}</p>
    </fieldset>
  );
}

// Who the group is for: two radio cards. Create only; the audience never changes.
function AudiencePicker({
  value,
  onChange,
  disabled,
}: {
  value: GroupAudience;
  onChange: (value: GroupAudience) => void;
  disabled: boolean;
}) {
  const t = useTranslations("GroupForm");
  const options = [
    { audience: "members", icon: UserGroupIcon },
    { audience: "guests", icon: HandRaisedIcon },
  ] as const;

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
      <legend className="mb-1.5 p-0 text-[13px] font-semibold text-heading">
        {t("audience")}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ audience, icon: Icon }) => (
          <label key={audience} className="relative flex">
            <input
              checked={value === audience}
              className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              disabled={disabled}
              name="audience"
              type="radio"
              onChange={() => onChange(audience)}
            />
            <span
              className={clsx(
                "flex w-full items-start gap-3 rounded-xl border p-4 transition-colors",
                "border-field-border bg-field-background peer-hover:border-accent",
                "peer-checked:border-accent peer-checked:bg-accent-soft",
                "peer-focus-visible:shadow-[var(--shadow-focus)] peer-disabled:opacity-60",
              )}
            >
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-eyebrow"
                strokeWidth={1.7}
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-heading">
                  {t(`audienceOptions.${audience}.label`)}
                </span>
                <span className="text-[13px] text-muted">
                  {t(`audienceOptions.${audience}.help`)}
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-[13px] text-muted">{t("audienceLock")}</p>
    </fieldset>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  errorText,
  help,
  required,
  disabled,
  placeholder,
}: {
  label: string;
  name: GroupField;
  value: string;
  onChange: (value: string) => void;
  error?: GroupErrorKey;
  errorText?: string;
  help?: string;
  required?: boolean;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <TextField
      className="gap-1.5"
      isDisabled={disabled}
      isInvalid={Boolean(error)}
      isRequired={required}
      name={name}
      validationBehavior="aria"
      value={value}
      onChange={onChange}
    >
      <Label className="text-[13px] font-semibold text-heading">{label}</Label>
      <InputGroup className="h-10 w-full rounded-control">
        <InputGroup.Input
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
 * One form for `/groups/new` and `/groups/{id}/edit`. Pass `groupId` and
 * `initial` to edit: only the fields that changed are sent. Validation runs on
 * submit; a field with an error is re-checked as it changes. `askAudience` (create only, when guest
 * groups are on) asks who the group is for.
 */
export function GroupForm({
  groupId,
  initial,
  cancelHref,
  askAudience = false,
}: {
  groupId?: string;
  initial?: GroupFormValues;
  cancelHref: string;
  askAudience?: boolean;
}) {
  const t = useTranslations("GroupForm");
  const router = useRouter();
  const isEdit = groupId !== undefined;
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<GroupFormValues>({
    name: initial?.name ?? "",
    meetingDay: initial?.meetingDay ?? null,
    meetingAddress: initial?.meetingAddress ?? "",
  });
  const [audience, setAudience] = useState<GroupAudience>("members");
  const [errors, setErrors] = useState<GroupFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (failures > 0) alertRef.current?.focus();
  }, [failures]);

  function validate(next: GroupFormValues): GroupFieldErrors {
    const parsed = groupSchema.safeParse(next);

    return parsed.success ? {} : toFieldErrors(parsed.error);
  }

  // Re-check a field once it has shown an error; leave the others alone.
  function update<TField extends GroupField>(
    field: TField,
    value: GroupFormValues[TField],
  ) {
    const next = { ...values, [field]: value };

    setValues(next);

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validate(next)[field] }));
    }
  }

  function fail(failure: GroupFormFailure) {
    setErrors(failure.fieldErrors ?? {});
    setFormError(failure.formError ?? null);
    setFailures((count) => count + 1);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate(values);

    if (Object.keys(found).length > 0) {
      fail({ ok: false, fieldErrors: found });

      return;
    }

    setErrors({});
    setFormError(null);

    if (!isEdit) {
      startTransition(async () => {
        fail(
          await createGroupAction(values, askAudience ? audience : "members"),
        );
      });

      return;
    }

    const original: GroupFormValues = {
      name: initial?.name ?? "",
      meetingDay: initial?.meetingDay ?? null,
      meetingAddress: initial?.meetingAddress ?? "",
    };
    const changes: Partial<GroupFormValues> = {};

    for (const field of GROUP_FIELDS) {
      const changed =
        field === "meetingDay"
          ? values.meetingDay !== original.meetingDay
          : values[field].trim() !== original[field].trim();

      if (changed) Object.assign(changes, { [field]: values[field] });
    }

    if (Object.keys(changes).length === 0) {
      router.push(cancelHref);

      return;
    }

    startTransition(async () => {
      fail(await updateGroupAction(groupId, changes));
    });
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const errorOf = (field: GroupField) =>
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

      <fieldset className="m-0 flex min-w-0 flex-col gap-5 border-0 px-6 pb-6 pt-0">
        <legend className="mb-1 w-full px-0 pb-0 pt-6">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-eyebrow">
            {t("eyebrow")}
          </span>
          <span
            className={title({ size: "sm", className: "block text-[22px]" })}
          >
            {t("heading")}
          </span>
        </legend>
        {!isEdit && askAudience && (
          <AudiencePicker
            disabled={isPending}
            value={audience}
            onChange={setAudience}
          />
        )}
        <Field
          required
          disabled={isPending}
          error={errors.name}
          errorText={errorOf("name")}
          help={t("nameHelp")}
          label={t("name")}
          name="name"
          value={values.name}
          onChange={(v) => update("name", v)}
        />
        <DayPicker
          disabled={isPending}
          value={values.meetingDay}
          onChange={(day) => update("meetingDay", day)}
        />
        <Field
          disabled={isPending}
          error={errors.meetingAddress}
          errorText={errorOf("meetingAddress")}
          help={t("addressHelp")}
          label={t("address")}
          name="meetingAddress"
          placeholder={t("addressPlaceholder")}
          value={values.meetingAddress}
          onChange={(v) => update("meetingAddress", v)}
        />
        {!isEdit && (
          <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
            <InformationCircleIcon
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <p>{t("newNote")}</p>
          </div>
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
            {isEdit ? t("save") : t("create")}
          </Button>
        </div>
      </div>
    </form>
  );
}
