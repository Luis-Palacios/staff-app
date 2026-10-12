import type { StatusBadgeProps } from "@/components/status-badge";

import { useTranslations } from "next-intl";

import { StatusBadge } from "@/components/status-badge";
import { AuthRole } from "@/lib/auth/roles";

// Most roles have no severity ordering between them, so they share the neutral
// badge; only the two ends worth flagging stand out. Admin gets the accent
// tone, and Pending gets a hollow warning ring because it's waiting on someone.
function roleBadgeProps(
  role: AuthRole | null,
): Pick<StatusBadgeProps, "tone" | "variant"> {
  if (role === AuthRole.Admin) return { tone: "accent" };
  if (role === AuthRole.Pending)
    return { tone: "warning", variant: "ring-dot" };

  return { tone: "neutral" };
}

// Works from server and client parents. `AuthRole` mirrors auth-server by
// hand, so an unknown role is shown as sent rather than as a missing key.
export function RoleBadge({ role }: { role: AuthRole | null }) {
  const t = useTranslations("Roles");

  return (
    <StatusBadge {...roleBadgeProps(role)}>
      {role ? (t.has(role) ? t(role) : role) : "—"}
    </StatusBadge>
  );
}
