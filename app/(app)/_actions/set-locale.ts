"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  incomingForwardedRequest,
  updateUserLocale,
} from "@/api/auth-api/client";
import { getServerSession } from "@/api/auth-api/helpers/get-server-session";
import { isLocale, LOCALE_COOKIE } from "@/lib/locale";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Saves the language picked in the account menu in the `ekk_locale` cookie, and for a signed-in
 * user also on their auth-server user (`locale`), which is the language their emails go out in.
 * A cookie as well as the user, so the choice survives sign-out and drives the UI even if the
 * second save fails (logged, not shown: the menu did what it said). The value is checked here
 * because a server action is a public endpoint: anything but a supported locale is refused. Like
 * switchChurch, callers don't need `router.refresh()`: `revalidatePath` re-renders the layouts
 * (and with them `<html lang>`) in the action's response.
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

  // Signed out (the sign-in pages' picker): the cookie is enough. auth-server down: same.
  try {
    if (await getServerSession()) {
      await updateUserLocale(await incomingForwardedRequest(), locale);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  revalidatePath("/", "layout");

  return { ok: true };
}
