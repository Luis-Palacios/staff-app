import type { MemberDetail } from "@/api/members-api/types";
import type { AccountStatus } from "@/lib/members/account";

import { ArrowLeftIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@heroui/react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";

import { InitialsAvatar } from "@/components/initials-avatar";
import { title } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { StaffAppBreadcrumbs } from "@/components/staff-app-breadcrumbs";
import { membersBreadcrumb } from "@/config/breadcrumbs";

// The person is the page, as on the application detail: avatar, name as the
// <h1>, a meta line and the actions on the right.
const ACCOUNT_BADGE = {
  linked: { tone: "success", variant: "solid-dot" },
  invited: { tone: "warning", variant: "ring-dot" },
  none: { tone: "neutral", variant: "ring-dot" },
} as const;

export function MemberDetailHeader({
  member,
  status,
}: {
  member: MemberDetail;
  status: AccountStatus;
}) {
  const t = useTranslations("MemberDetailHeader");
  const tStatus = useTranslations("AccountStatus");
  const { id, name, smallGroups } = member;

  return (
    <header className="mb-6 flex flex-col gap-6">
      <StaffAppBreadcrumbs
        items={[membersBreadcrumb, { label: name, href: `/members/${id}` }]}
      />
      <div className="flex flex-wrap items-center gap-5">
        <InitialsAvatar
          className="bg-accent text-[22px] text-accent-foreground"
          name={name}
          size="xl"
        />
        <div className="flex flex-[1_1_280px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className={title({ size: "md" })}>{name}</h1>
            <NextLink
              aria-label={t("accountLabel", { status: tStatus(status) })}
              href="#acct-title"
            >
              <StatusBadge {...ACCOUNT_BADGE[status]}>
                {tStatus(status)}
              </StatusBadge>
            </NextLink>
          </div>
          <p className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            <span>
              {t("member")}{" "}
              <strong className="font-semibold text-heading">#{id}</strong>
            </span>
            <span>
              {t.rich("groupCount", {
                count: smallGroups.length,
                strong: (chunks) => (
                  <strong className="font-semibold text-heading">
                    {chunks}
                  </strong>
                ),
              })}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <NextLink
            className={buttonVariants({
              variant: "outline",
              className: "gap-2 font-semibold text-heading",
            })}
            href="/members"
          >
            <ArrowLeftIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
            {t("allMembers")}
          </NextLink>
          <NextLink
            className={buttonVariants({
              variant: "primary",
              className: "gap-2",
            })}
            href={`/members/${id}/edit`}
          >
            <PencilSquareIcon
              aria-hidden="true"
              className="size-4"
              strokeWidth={2}
            />
            {t("edit")}
          </NextLink>
        </div>
      </div>
    </header>
  );
}
