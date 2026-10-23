import "server-only";

import type { PermissionCheck } from "@/lib/auth/permissions";

import { notFound } from "next/navigation";

import { getFeatures } from "@/api/members-api/client";
import { requirePermission } from "@/lib/auth/get-permissions";

/**
 * The guest pages need the church setting on and the caller's permission (the nav item and the
 * page make the same check); anything else is a 404, including a failed settings read. Scope is the API's: a guest outside it is 404.
 */
export async function requireGuests(check: PermissionCheck) {
  const features = await getFeatures().catch(() => ({ guestGroups: false }));

  if (!features.guestGroups) notFound();

  await requirePermission(check);
}
