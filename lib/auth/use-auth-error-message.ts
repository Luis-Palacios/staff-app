"use client";

import type { Messages } from "next-intl";

import { useTranslations } from "next-intl";

type AuthErrorKey = Exclude<keyof Messages["AuthErrors"], "generic">;

// better-auth `error.code` -> AuthErrors key. Map codes, never message text
// (I18N-ROADMAP, "Errors from the APIs"). Anything not listed falls back to
// the generic message, so a new backend error never shows raw English.
const CODE_TO_KEY: Record<string, AuthErrorKey> = {
  INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
  INVALID_EMAIL: "invalidEmail",
  USER_ALREADY_EXISTS: "userAlreadyExists",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "userAlreadyExists",
  PASSWORD_TOO_SHORT: "passwordTooShort",
  PASSWORD_TOO_LONG: "passwordTooLong",
  EMAIL_NOT_VERIFIED: "emailNotVerified",
  INVALID_TOKEN: "invalidToken",
  TOKEN_EXPIRED: "invalidToken",
  YOU_CANNOT_CHANGE_YOUR_OWN_ROLE: "cannotChangeOwnRole",
  YOU_CANNOT_BAN_YOURSELF: "cannotBanYourself",
  YOU_CANNOT_ASSIGN_ADMIN_ROLE: "cannotAssignAdmin",
  YOU_CANNOT_MANAGE_ADMIN_ACCOUNTS: "cannotManageAdmin",
  YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE: "notAllowed",
  YOU_ARE_NOT_ALLOWED_TO_BAN_USERS: "notAllowed",
};

/**
 * Returns a function that turns a better-auth error into text in the current
 * language. Rate limiting carries no code, only HTTP 429, so that is matched
 * by status.
 */
export function useAuthErrorMessage() {
  const t = useTranslations("AuthErrors");

  return (error: { code?: string; status?: number }): string => {
    if (error.status === 429) return t("tooManyRequests");

    const key = error.code ? CODE_TO_KEY[error.code] : undefined;

    return key ? t(key) : t("generic");
  };
}
