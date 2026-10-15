import type { MemberAccount } from "@/app/(app)/members/_lib/load-member-account";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";

import { MemberAccountActions } from "./member-account-actions";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { RoleBadge } from "@/app/(app)/users/_components/role-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { card, textLink } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatLocalDate } from "@/lib/format-date";

// Only rendered for roles that can manage links.
export function MemberAccountCard({
  account,
  member,
}: {
  account: MemberAccount;
  member: { id: number; name: string; email: string | null };
}) {
  const t = useTranslations("MemberAccountCard");
  const locale = useLocale() as Locale;
  const { status, user } = account;

  return (
    <section
      aria-labelledby="acct-title"
      className={card({
        className: "flex min-w-0 flex-col gap-3 px-6 pb-5 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("eyebrow")} id="acct-title">
        {t("title")}
      </DetailCardHeading>

      {status === "none" && (
        <div className="flex flex-col gap-1 py-1">
          <p className="text-[15px] font-semibold text-heading">
            {t("noneTitle")}
          </p>
          <p className="text-sm text-muted">{t("noneBody")}</p>
        </div>
      )}

      {status === "invited" && (
        <div className="flex flex-col gap-1 py-1">
          <p className="text-[15px] font-semibold text-heading">
            {t("invitedTitle")}
          </p>
          <p className="break-words text-sm text-muted">
            {t("invitedBody", { email: account.invitedEmail ?? "" })}
          </p>
          {account.invitedAt && (
            <p className="text-[13px] text-muted">
              {account.inviterName
                ? t("invitedBy", {
                    name: account.inviterName,
                    date: formatLocalDate(account.invitedAt, locale),
                  })
                : t("invitedOn", {
                    date: formatLocalDate(account.invitedAt, locale),
                  })}
            </p>
          )}
        </div>
      )}

      {status === "linked" && !user && (
        <div className="flex flex-col gap-1 py-1">
          <p className="text-[15px] font-semibold text-heading">
            {t("missingTitle")}
          </p>
          <p className="text-sm text-muted">{t("missingBody")}</p>
        </div>
      )}

      {status === "linked" && user && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3.5">
            <InitialsAvatar
              className="bg-accent text-accent-foreground"
              name={user.name}
              size="lg"
            />
            <div className="flex min-w-0 flex-col">
              <span className="break-words text-[15px] font-semibold text-heading">
                {user.name}
              </span>
              <span className="break-all text-sm text-muted">{user.email}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge
              tone={user.emailVerified ? "success" : "warning"}
              variant={user.emailVerified ? "solid-dot" : "ring-dot"}
            >
              {user.emailVerified ? t("verified") : t("notVerified")}
            </StatusBadge>
          </div>
          <p className="text-[13px] text-muted">
            {t("signedUp", { date: formatLocalDate(user.createdAt, locale) })}
          </p>
          <NextLink
            className={textLink({ className: "text-sm" })}
            href={`/users/${user.id}`}
          >
            {t("goToAccess")}
          </NextLink>
        </div>
      )}
      <MemberAccountActions
        account={{
          status,
          inviteToken: account.inviteToken,
          invitedEmail: account.invitedEmail,
          userName: user?.name ?? null,
        }}
        member={member}
      />
    </section>
  );
}
