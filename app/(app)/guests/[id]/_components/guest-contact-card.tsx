import type { GuestDetail } from "@/api/guests-api/types";
import type { ComponentType, ReactNode, SVGProps } from "react";

import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import NextLink from "next/link";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";

export function DetailField({
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

export function GuestContactCard({
  guest,
  canEdit,
}: {
  guest: GuestDetail;
  canEdit: boolean;
}) {
  const t = useTranslations("GuestContactCard");
  const { id, email, phone, address, sex } = guest;
  const notProvided = <span className="text-subtle">{t("notProvided")}</span>;

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
        {canEdit && (
          <NextLink
            aria-label={t("editLabel")}
            className={textLink({ className: "text-sm font-semibold" })}
            href={`/guests/${id}/edit`}
          >
            {t("edit")}
          </NextLink>
        )}
      </div>
      <dl className="flex flex-col divide-y divide-separator">
        <DetailField icon={PhoneIcon} label={t("phone")}>
          {phone ?? notProvided}
        </DetailField>
        <DetailField icon={EnvelopeIcon} label={t("email")}>
          {email ?? notProvided}
        </DetailField>
        <DetailField icon={MapPinIcon} label={t("address")}>
          {address ?? notProvided}
        </DetailField>
        <DetailField icon={UserIcon} label={t("sex")}>
          {sex ? t(sex === "male" ? "sexMale" : "sexFemale") : notProvided}
        </DetailField>
      </dl>
    </section>
  );
}
