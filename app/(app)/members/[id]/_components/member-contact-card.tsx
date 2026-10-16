import type { MemberDetail } from "@/api/members-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { ComponentType, ReactNode, SVGProps } from "react";

import {
  CakeIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { ageFromCalendarDate, formatCalendarDate } from "@/lib/format-date";

function Field({
  icon: Icon,
  label,
  bleed = false,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  /** Full-width row with a divider above it, for the card without side padding. */
  bleed?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        bleed
          ? "flex items-start gap-3.5 border-t border-separator px-6 py-3.5"
          : "flex items-start gap-3.5 py-3"
      }
    >
      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-tile bg-accent-soft text-accent-soft-foreground">
        <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.7} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-[12.5px] font-semibold text-muted">{label}</dt>
        <dd className="break-words text-[15px] text-body">{children}</dd>
      </div>
    </div>
  );
}

// `self` is My profile: read-only, with a note on who to ask to fix the record.
export function MemberContactCard({
  member,
  variant = "default",
  canEdit = true,
}: {
  member: MemberDetail;
  variant?: "default" | "self";
  /** Show the Edit link (`members: update`). */
  canEdit?: boolean;
}) {
  const t = useTranslations("MemberContactCard");
  const tSelf = useTranslations("MyProfilePage");
  const locale = useLocale() as Locale;
  const { id, email, phone, address, birthDate, sex } = member;
  const notProvided = <span className="text-subtle">{t("notProvided")}</span>;
  const age = birthDate ? ageFromCalendarDate(birthDate) : null;
  const self = variant === "self";

  return (
    <section
      className={card({
        className: self
          ? "flex min-w-0 flex-col overflow-hidden pt-5"
          : "flex min-w-0 flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <div
        className={
          self
            ? "flex items-start justify-between gap-4 px-6 pb-4"
            : "flex items-start justify-between gap-4"
        }
      >
        <DetailCardHeading
          eyebrow={self ? tSelf("memberEyebrow") : t("eyebrow")}
        >
          {t("title")}
        </DetailCardHeading>
        {!self && canEdit && (
          <NextLink
            aria-label={t("editLabel")}
            className={textLink({ className: "text-sm font-semibold" })}
            href={`/members/${id}/edit`}
          >
            {t("edit")}
          </NextLink>
        )}
      </div>
      <dl
        className={
          self ? "flex flex-col" : "flex flex-col divide-y divide-separator"
        }
      >
        <Field bleed={self} icon={EnvelopeIcon} label={t("email")}>
          {email ?? notProvided}
        </Field>
        <Field bleed={self} icon={PhoneIcon} label={t("phone")}>
          {phone ?? notProvided}
        </Field>
        <Field bleed={self} icon={MapPinIcon} label={t("address")}>
          {address ?? notProvided}
        </Field>
        <Field bleed={self} icon={CakeIcon} label={t("birthDate")}>
          {birthDate ? (
            <>
              {formatCalendarDate(birthDate, locale)}
              {age !== null && (
                <span className="block text-[13px] text-muted">
                  {t("age", { age })}
                </span>
              )}
            </>
          ) : (
            notProvided
          )}
        </Field>
        <Field bleed={self} icon={UserIcon} label={t("sex")}>
          {sex ? t(sex === "male" ? "sexMale" : "sexFemale") : notProvided}
        </Field>
      </dl>
      {self && (
        <p className="flex items-start gap-2.5 border-t border-separator bg-surface-secondary px-6 pb-[18px] pt-3.5 text-[13.5px] text-muted">
          <InformationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-[18px] shrink-0"
            strokeWidth={1.7}
          />
          {tSelf("contactFooter")}
        </p>
      )}
    </section>
  );
}
