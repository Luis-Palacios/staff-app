"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { CHURCH_COOKIE, getChurchContext } from "@/lib/workspace";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Makes `churchId` the church this user works in, by saving it in the
 * `ekk_church` cookie. Only ids from the user's own `churches` are accepted:
 * a server action is a public endpoint, so the id is checked here, not just
 * in the menu. Callers don't need `router.refresh()`: `revalidatePath` sends
 * the re-rendered page back with the action's response.
 */
export async function switchChurch(churchId: string): Promise<{ ok: boolean }> {
  const { churches } = await getChurchContext();

  if (!churches.some((church) => church.id === churchId)) {
    return { ok: false };
  }

  (await cookies()).set(CHURCH_COOKIE, churchId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  });

  // Everything under the (app) layout shows church-scoped data.
  revalidatePath("/", "layout");

  return { ok: true };
}
