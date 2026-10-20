import type { AdminUserListItem } from "@/api/auth-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { UserAccountActions } from "./user-account-actions";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { RoleBadge } from "@/app/(app)/users/_components/role-badge";
import { UserStatusChips } from "@/app/(app)/users/_components/user-status-chips";
import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatLocalDate } from "@/lib/format-date";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="m-0 flex flex-wrap items-center gap-1.5 break-words text-[15px] text-heading">
        {children}
      </dd>
    </div>
  );
}

// Shows the account; the actions below it (role, ban) appear with the caller's permissions.
export function UserAccountCard({ user }: { user: AdminUserListItem }) {
  const t = useTranslations("UserDetail");
  const locale = useLocale() as Locale;

  return (
    <section
      aria-labelledby="user-account-title"
      className={card({
        className: "flex min-w-0 flex-col gap-4 px-6 pb-5 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("accountEyebrow")} id="user-account-title">
        {t("accountTitle")}
      </DetailCardHeading>
      <dl className="m-0 grid gap-4 sm:grid-cols-2">
        <Field label={t("name")}>{user.name}</Field>
        <Field label={t("email")}>
          <span className="break-all">{user.email}</span>
        </Field>
        <Field label={t("role")}>
          <RoleBadge role={user.role} />
        </Field>
        <Field label={t("verified")}>
          <StatusBadge
            tone={user.emailVerified ? "success" : "warning"}
            variant={user.emailVerified ? "solid-dot" : "ring-dot"}
          >
            {user.emailVerified ? t("verifiedYes") : t("verifiedNo")}
          </StatusBadge>
        </Field>
        <Field label={t("status")}>
          <UserStatusChips user={user} />
        </Field>
        <Field label={t("joined")}>
          {formatLocalDate(user.createdAt, locale)}
        </Field>
        {user.banned && (
          <>
            <Field label={t("banReason")}>
              {user.banReason ?? t("noReason")}
            </Field>
            <Field label={t("banExpires")}>
              {user.banExpires
                ? formatLocalDate(user.banExpires, locale)
                : t("banNoExpiry")}
            </Field>
          </>
        )}
      </dl>
      <UserAccountActions user={user} />
    </section>
  );
}
