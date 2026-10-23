import type { GuestDetail } from "@/api/guests-api/types";
import type { Locale } from "@/lib/locale-shared";

import {
  CalendarDaysIcon,
  HandRaisedIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { DetailField } from "./guest-contact-card";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { formatCalendarDate } from "@/lib/format-date";

// "How they came": first visit, who invited them and who added them. The names link to a member
// profile only for a viewer who can open members.
export function GuestOriginCard({
  guest,
  canViewMembers,
}: {
  guest: GuestDetail;
  canViewMembers: boolean;
}) {
  const t = useTranslations("GuestOriginCard");
  const locale = useLocale() as Locale;
  const { firstVisitDate, invitedBy, createdBy, createdAt } = guest;
  const notProvided = <span className="text-subtle">{t("notProvided")}</span>;
  const person = (ref: { id: number; name: string }) =>
    canViewMembers ? (
      <NextLink className={textLink()} href={`/members/${ref.id}`}>
        {ref.name}
      </NextLink>
    ) : (
      ref.name
    );
  const addedOn = formatCalendarDate(createdAt.slice(0, 10), locale);

  return (
    <section
      className={card({
        className: "flex min-w-0 flex-col gap-2 px-6 pb-4 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")}>{t("title")}</DetailCardHeading>
      <dl className="flex flex-col divide-y divide-separator">
        <DetailField icon={CalendarDaysIcon} label={t("firstVisit")}>
          {firstVisitDate
            ? formatCalendarDate(firstVisitDate, locale)
            : notProvided}
        </DetailField>
        <DetailField icon={HandRaisedIcon} label={t("invitedBy")}>
          {invitedBy ? person(invitedBy) : notProvided}
        </DetailField>
        <DetailField icon={UserPlusIcon} label={t("addedBy")}>
          {createdBy
            ? t.rich("addedByOn", {
                name: () => person(createdBy),
                date: addedOn,
              })
            : addedOn}
        </DetailField>
      </dl>
    </section>
  );
}
