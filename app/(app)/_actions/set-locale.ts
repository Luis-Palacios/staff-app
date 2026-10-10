"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isLocale, LOCALE_COOKIE } from "@/lib/locale";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Saves the language picked in the account menu in the `ekk_locale` cookie.
 * A cookie, not the session, so the choice survives sign-out. The value is
 * checked here because a server action is a public endpoint: anything but a
 * supported locale is refused. Like switchChurch, callers don't need
 * `router.refresh()`: `revalidatePath` re-renders the layouts (and with them
 * `<html lang>`) in the action's response.
 */
export async function setLocale(locale: string): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false };

  (await cookies()).set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  });

  // TODO(i18n): also save it to the user's profile on the auth-server, so the
  // choice follows them to other devices.

  revalidatePath("/", "layout");

  return { ok: true };
}
