import "server-only";

import type { PermissionCheck, Permissions } from "@/lib/auth/permissions";

import { notFound } from "next/navigation";

import { ApiError } from "@/api/api-client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { can } from "@/lib/auth/permissions";

/** The signed-in user's permissions; none without a session. */
export async function getPermissions(): Promise<Permissions> {
  const session = await getServerSession();

  return session?.permissions ?? {};
}

/** Whether the signed-in user has all of `check`. */
export async function hasPermission(check: PermissionCheck): Promise<boolean> {
  return can(await getPermissions(), check);
}

/**
 * For a page: the shared 404 when `check` fails, so a page hidden from the nav is also unreachable
 * by URL (rule 7). Missing a permission and being out of scope look the same to the visitor.
 */
export async function requirePermission(check: PermissionCheck): Promise<void> {
  if (!(await hasPermission(check))) notFound();
}

/**
 * For a server action: the error to report when `check` fails, or null when it passes. The API
 * enforces the same permission; this keeps a call the user can't make from going out at all
 * (rule 9). Turn it into the action's own failure shape with `getApiErrorMessage`.
 */
export async function forbiddenUnless(
  check: PermissionCheck,
): Promise<ApiError | null> {
  if (await hasPermission(check)) return null;

  return new ApiError({
    status: 403,
    statusText: "Forbidden",
    url: "",
    method: "",
    body: null,
  });
}
