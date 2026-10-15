import type { MemberDetail } from "@/api/members-api/types";
import type { Locale } from "@/lib/locale-shared";
import type { ComponentType, ReactNode, SVGProps } from "react";

import {
  CakeIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { ageFromCalendarDate, formatCalendarDate } from "@/lib/format-date";

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5 py-3">
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
}: {
  member: MemberDetail;
  variant?: "default" | "self";
}) {
  const t = useTranslations("MemberContactCard");
  const tSelf = useTranslations("MyProfilePage");
  const locale = useLocale() as Locale;
  const { id, email, phone, address, birthDate } = member;
  const notProvided = <span className="text-subtle">{t("notProvided")}</span>;
  const age = birthDate ? ageFromCalendarDate(birthDate) : null;

  return (
    <section
      className={card({
        className: "flex min-w-0 flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <div className="flex items-start justify-between gap-4">
        <DetailCardHeading eyebrow={t("eyebrow")}>
          {t("title")}
        </DetailCardHeading>
        {variant === "default" && (
          <NextLink
            aria-label={t("editLabel")}
            className={textLink({ className: "text-sm font-semibold" })}
            href={`/members/${id}/edit`}
          >
            {t("edit")}
          </NextLink>
        )}
      </div>
      <dl className="flex flex-col divide-y divide-separator">
        <Field icon={EnvelopeIcon} label={t("email")}>
          {email ?? notProvided}
        </Field>
        <Field icon={PhoneIcon} label={t("phone")}>
          {phone ?? notProvided}
        </Field>
        <Field icon={MapPinIcon} label={t("address")}>
          {address ?? notProvided}
        </Field>
        <Field icon={CakeIcon} label={t("birthDate")}>
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
      </dl>
      {variant === "self" && (
        <p className="mt-2 flex items-start gap-2.5 border-t border-separator pt-4 text-[13.5px] text-muted">
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
