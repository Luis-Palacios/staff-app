import type { AuthSessionUser } from "@/api/auth-api/types";
import type { Locale } from "@/lib/locale-shared";

import { useLocale, useTranslations } from "next-intl";

import { DetailCardHeading } from "@/app/(app)/applications/[id]/_components/detail-card-heading";
import { RoleBadge } from "@/app/(app)/users/_components/role-badge";
import { card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { formatLocalDateTime } from "@/lib/format-date";

function Field({
  label,
  stacked,
  children,
}: {
  label: string;
  stacked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        stacked
          ? "flex flex-col gap-1 border-t border-separator px-6 py-3.5"
          : "flex flex-col gap-1 border-b border-separator px-6 py-3.5"
      }
    >
      <dt className="text-[12.5px] font-semibold text-muted">{label}</dt>
      <dd className="m-0 flex flex-wrap items-center gap-1.5 break-words text-[15px] text-heading">
        {children}
      </dd>
    </div>
  );
}

// Read-only sign-in details of the signed-in user, straight from the session. The card has no
// side padding: rows run edge to edge with dividers. `stacked` is the not-linked page: one
// column, a divider above every row, no footer line.
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
        className: "flex min-w-0 flex-col overflow-hidden pt-5",
      })}
    >
      <div className="px-6 pb-4">
        <DetailCardHeading eyebrow={t("accountEyebrow")} id="my-account-title">
          {t("accountTitle")}
        </DetailCardHeading>
      </div>
      <dl
        className={
          stacked
            ? "m-0 flex flex-col"
            : "m-0 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] border-t border-separator"
        }
      >
        <Field label={tUser("email")} stacked={stacked}>
          <span className="break-words">{user.email}</span>
          <StatusBadge
            tone={user.emailVerified ? "success" : "warning"}
            variant={user.emailVerified ? "solid-dot" : "ring-dot"}
          >
            {user.emailVerified ? tUser("verifiedYes") : tUser("verifiedNo")}
          </StatusBadge>
        </Field>
        <Field label={tUser("role")} stacked={stacked}>
          <RoleBadge role={user.role} />
        </Field>
        <Field label={t("accountCreated")} stacked={stacked}>
          {formatLocalDateTime(user.createdAt, locale)}
        </Field>
      </dl>
      {!stacked && (
        <p className="px-6 pb-[18px] pt-3.5 text-[13.5px] text-muted">
          {t("accountFooter")}
        </p>
      )}
    </section>
  );
}
