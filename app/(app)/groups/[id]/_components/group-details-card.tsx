import type { SmallGroupDetail } from "@/api/small-groups-api/types";
import type { ComponentType, ReactNode, SVGProps } from "react";

import {
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import NextLink from "next/link";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card, textLink } from "@/components/primitives";
import { WEEKDAY_KEYS } from "@/lib/weekdays";

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

function MemberLink({ id, name }: { id: number; name: string }) {
  return (
    <NextLink
      className={textLink({ className: "font-medium" })}
      href={`/members/${id}`}
    >
      {name}
    </NextLink>
  );
}

export function GroupDetailsCard({ group }: { group: SmallGroupDetail }) {
  const t = useTranslations("GroupDetailsCard");
  const tDay = useTranslations("Weekdays");
  const { id, meetingDay, meetingAddress, closedAt, members } = group;
  const notSet = <span className="text-subtle">{t("notSet")}</span>;
  const leader = members.find((member) => member.role === "leader");
  const coLeaders = members.filter((member) => member.role === "co_leader");

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
        {!closedAt && (
          <NextLink
            aria-label={t("editLabel")}
            className={textLink({ className: "text-sm font-semibold" })}
            href={`/groups/${id}/edit`}
          >
            {t("edit")}
          </NextLink>
        )}
      </div>
      <dl className="flex flex-col divide-y divide-separator">
        <Field icon={CalendarIcon} label={t("meetingDay")}>
          {meetingDay === null ? notSet : tDay(WEEKDAY_KEYS[meetingDay])}
        </Field>
        <Field icon={MapPinIcon} label={t("meetingAddress")}>
          {meetingAddress ?? notSet}
        </Field>
        <Field icon={StarIcon} label={t("leader")}>
          {leader ? (
            <MemberLink id={leader.person.id} name={leader.person.name} />
          ) : (
            <span className="text-subtle">
              {closedAt ? t("noActiveLeader") : t("noLeader")}
            </span>
          )}
        </Field>
        <Field icon={UsersIcon} label={t("coLeaders")}>
          {coLeaders.length === 0 ? (
            <span className="text-subtle">{t("none")}</span>
          ) : (
            coLeaders.map((member, index) => (
              <span key={member.person.id}>
                {index > 0 && ", "}
                <MemberLink id={member.person.id} name={member.person.name} />
              </span>
            ))
          )}
        </Field>
      </dl>
    </section>
  );
}
