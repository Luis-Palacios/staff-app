import { InformationCircleIcon, LinkIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";

// The not-linked page: says what linking adds. Admins and elders can start the link from their
// own user record; everyone else is told who to ask. Read-only, nothing is linked from here.
export function MyMemberCard({
  churchName,
  userId,
  canLink,
}: {
  churchName: string;
  userId: string;
  canLink: boolean;
}) {
  const t = useTranslations("MyProfilePage");

  return (
    <section
      aria-labelledby="my-member-title"
      className={card({
        className: "flex min-w-0 flex-col gap-4 px-6 pb-5 pt-5",
      })}
    >
      <div className="flex items-start justify-between gap-4">
        <DetailCardHeading eyebrow={t("memberEyebrow")} id="my-member-title">
          {t("memberTitle")}
        </DetailCardHeading>
        <StatusBadge tone="neutral" variant="ring-dot">
          {t("notLinked")}
        </StatusBadge>
      </div>
      <div className="flex flex-col gap-3 text-[14.5px] leading-relaxed text-body">
        <p>{t("notLinkedBody", { church: churchName })}</p>
        <p>{t("notLinkedWhy")}</p>
      </div>
      {canLink ? (
        <div className="flex flex-col items-start gap-2">
          <NextLink
            className={buttonVariants({
              variant: "primary",
              className: "gap-2",
            })}
            href={`/users/${userId}`}
          >
            <LinkIcon aria-hidden="true" className="size-4" strokeWidth={2} />
            {t("linkSelf")}
          </NextLink>
          <p className="text-[13px] text-muted">{t("linkSelfHint")}</p>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent-soft-foreground">
          <InformationCircleIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0"
          />
          <span className="min-w-0 break-words">{t("askToLink")}</span>
        </div>
      )}
    </section>
  );
}
