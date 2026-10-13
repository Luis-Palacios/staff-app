"use client";

import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import {
  Description,
  FieldError,
  Input,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { Label } from "@heroui/react/label";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import {
  OTHER_COUNTRY,
  PHONE_COUNTRIES,
  type PhoneParts,
} from "@/app/(app)/members/_lib/phone-countries";

function IsoTag({ code }: { code: string }) {
  return (
    <span className="inline-flex h-[18px] w-[26px] shrink-0 items-center justify-center rounded-[4px] border border-field-border text-[10px] font-bold tracking-wide text-muted">
      {code}
    </span>
  );
}

// Country picker + national number in one bordered group. The picker is a
// HeroUI Select, which brings the arrow keys, type-to-jump and Esc; the
// number is a plain `tel` input. `Other` appears only when the stored phone
// had no known dial code, so an old value round-trips unchanged.
export function PhoneField({
  value,
  onChange,
  error,
  hasOther,
  isDisabled,
}: {
  value: PhoneParts;
  onChange: (value: PhoneParts) => void;
  error?: string;
  hasOther: boolean;
  isDisabled: boolean;
}) {
  const t = useTranslations("MemberForm");
  const selected = PHONE_COUNTRIES.find((c) => c.code === value.country);

  return (
    <TextField
      className="gap-1.5"
      isDisabled={isDisabled}
      isInvalid={Boolean(error)}
      type="tel"
      validationBehavior="aria"
      value={value.number}
      onChange={(number) => onChange({ ...value, number })}
    >
      <Label className="text-[13px] font-semibold text-heading">
        {t("phone")}
      </Label>
      <div
        className={clsx(
          "flex h-10 w-full items-stretch rounded-control border bg-field transition-shadow focus-within:shadow-[var(--shadow-focus)]",
          error ? "border-danger" : "border-field-border",
        )}
      >
        <Select.Root
          aria-label={t("phoneCountry")}
          className="shrink-0"
          isDisabled={isDisabled}
          selectedKey={value.country}
          onSelectionChange={(key) =>
            key && onChange({ ...value, country: String(key) })
          }
        >
          <Select.Trigger className="h-full min-h-0 items-center gap-2 rounded-none rounded-l-control border-0 border-r border-field-border bg-transparent px-3 py-0 shadow-none">
            <IsoTag code={selected?.code ?? "—"} />
            {selected && (
              <span className="text-sm font-semibold tabular-nums text-heading">
                {selected.dialCode}
              </span>
            )}
            <ChevronDownIcon aria-hidden="true" className="size-4 text-muted" />
          </Select.Trigger>
          <Select.Popover className="w-[300px] rounded-2xl border border-overlay-border">
            <ListBox aria-label={t("phoneCountry")}>
              {[
                ...PHONE_COUNTRIES.map((c) => (
                  <ListBox.Item key={c.code} id={c.code} textValue={c.name}>
                    <IsoTag code={c.code} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-sm tabular-nums text-muted">
                      {c.dialCode}
                    </span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )),
                ...(hasOther
                  ? [
                      <ListBox.Item
                        key={OTHER_COUNTRY}
                        id={OTHER_COUNTRY}
                        textValue={t("phoneOther")}
                      >
                        <IsoTag code="—" />
                        <span className="flex-1">{t("phoneOther")}</span>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>,
                    ]
                  : []),
              ]}
            </ListBox>
          </Select.Popover>
        </Select.Root>
        <Input
          autoComplete="tel-national"
          className="h-full min-w-0 flex-1 rounded-none rounded-r-control border-0 bg-transparent px-3 text-sm shadow-none focus:shadow-none focus-visible:shadow-none"
          placeholder="8888 8888"
        />
      </div>
      {error ? (
        <FieldError className="flex items-center gap-1.5 text-[13px] text-danger">
          <ExclamationCircleIcon aria-hidden="true" className="size-4" />
          {error}
        </FieldError>
      ) : (
        <Description className="text-[13px] text-muted">
          {t("phoneHelp")}
        </Description>
      )}
    </TextField>
  );
}
