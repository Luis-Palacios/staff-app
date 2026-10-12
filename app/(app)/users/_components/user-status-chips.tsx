import type { AdminUserListItem } from "@/api/auth-api/types";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";

export function UserStatusChips({
  user,
}: {
  user: Pick<AdminUserListItem, "banned" | "emailVerified">;
}) {
  const t = useTranslations("UserStatus");

  if (!user.banned && user.emailVerified) {
    return <StatusBadge tone="success">{t("active")}</StatusBadge>;
  }

  return (
    <>
      {user.banned && <StatusBadge tone="danger">{t("banned")}</StatusBadge>}
      {!user.emailVerified && (
        <StatusBadge tone="warning" variant="ring-dot">
          {t("unverified")}
        </StatusBadge>
      )}
    </>
  );
}
