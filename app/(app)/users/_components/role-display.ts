import type { AuthRole } from "@/api/auth-api/types";

// Only default | accent | danger | success | warning exist on HeroUI's Chip (no "secondary") —
// verified in @heroui/styles' chipVariants. With 6 roles and no real severity ordering between
// most of them, only the two ends worth flagging get a distinct color.
export function roleChipColor(
  role: AuthRole | null,
): "default" | "danger" | "warning" {
  if (role === "admin") return "danger";
  if (role === "pending") return "warning";

  return "default";
}

export const ROLE_LABELS: Record<AuthRole, string> = {
  admin: "Admin",
  user: "User",
  smallGroupLeader: "Small Group Leader",
  deacon: "Deacon",
  pending: "Pending",
  elder: "Elder",
};

export function roleLabel(role: AuthRole | null): string {
  return role ? ROLE_LABELS[role] : "—";
}
