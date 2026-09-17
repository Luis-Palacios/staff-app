import { AuthRole, ROLE_LABELS } from "@/lib/auth/roles";

// Only default | accent | danger | success | warning exist on HeroUI's Chip (no "secondary") —
// verified in @heroui/styles' chipVariants. With 6 roles and no real severity ordering between
// most of them, only the two ends worth flagging get a distinct color.
export function roleChipColor(
  role: AuthRole | null,
): "default" | "danger" | "warning" {
  if (role === AuthRole.Admin) return "danger";
  if (role === AuthRole.Pending) return "warning";

  return "default";
}

export function roleLabel(role: AuthRole | null): string {
  return role ? ROLE_LABELS[role] : "—";
}
