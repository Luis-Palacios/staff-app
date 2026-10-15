import type { AuthSessionUser } from "@/api/auth-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { RoleBadge } from "@/app/(app)/users/_components/role-badge";
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

// Read-only sign-in details of the signed-in user, straight from the session. `stacked` is the
// not-linked page: one column, rows divided, no footer line.
export function MyAccountCard({
  user,
  stacked = false,
}: {
  user: AuthSessionUser;
  stacked?: boolean;
}) {
  const t = useTranslations("MyProfilePage");
  const tUser = useTranslations("UserDetail");
  const locale = useLocale() as Locale;

  return (
    <section
      aria-labelledby="my-account-title"
      className={card({
        className: "flex min-w-0 flex-col gap-4 px-6 pb-5 pt-5",
      })}
    >
      <DetailCardHeading eyebrow={t("accountEyebrow")} id="my-account-title">
        {t("accountTitle")}
      </DetailCardHeading>
      <dl
        className={
          stacked
            ? "m-0 flex flex-col gap-4 divide-y divide-separator [&>div:not(:first-child)]:pt-4"
            : "m-0 grid gap-4 sm:grid-cols-2"
        }
      >
        <Field label={tUser("email")}>
          <span className="break-all">{user.email}</span>
          <StatusBadge
            tone={user.emailVerified ? "success" : "warning"}
            variant={user.emailVerified ? "solid-dot" : "ring-dot"}
          >
            {user.emailVerified ? tUser("verifiedYes") : tUser("verifiedNo")}
          </StatusBadge>
        </Field>
        <Field label={tUser("role")}>
          <RoleBadge role={user.role} />
        </Field>
        <Field label={t("accountCreated")}>
          {formatLocalDate(user.createdAt, locale)}
        </Field>
      </dl>
      {!stacked && (
        <p className="border-t border-separator pt-4 text-[13.5px] text-muted">
          {t("accountFooter")}
        </p>
      )}
    </section>
  );
}
