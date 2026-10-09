import type { StatusBadgeProps } from "@/components/status-badge";

import { AuthRole, ROLE_LABELS } from "@/lib/auth/roles";

// Most roles have no severity ordering between them, so they share the neutral
// badge; only the two ends worth flagging stand out. Admin gets the accent
// tone, and Pending gets a hollow warning ring because it's waiting on someone.
export function roleBadgeProps(
  role: AuthRole | null,
): Pick<StatusBadgeProps, "tone" | "variant"> {
  if (role === AuthRole.Admin) return { tone: "accent" };
  if (role === AuthRole.Pending)
    return { tone: "warning", variant: "ring-dot" };

  return { tone: "neutral" };
}

export function roleLabel(role: AuthRole | null): string {
  return role ? ROLE_LABELS[role] : "—";
}
