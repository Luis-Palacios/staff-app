import type { Messages } from "next-intl";

/**
 * The only message namespaces sent to the browser. Server Components
 * translate on the server and ship plain text, so their namespaces never
 * belong here. Add a namespace only when a "use client" component calls
 * useTranslations() with it, and prefer passing translated strings down as
 * props when a client leaf needs just a label or two.
 *
 * This list is what the client pays for, so keep it reviewable.
 */
export const CLIENT_NAMESPACES = [
  "AcceptInvite",
  "AccountMenu",
  "ApplicationStatus",
  "ApplicationsBrowser",
  "AssignPendingRole",
  "AuthErrors",
  "CancelInviteButton",
  "ChurchContext",
  "ConfirmDialog",
  "DataTable",
  "ErrorState",
  "ForgotPasswordForm",
  "InviteStatus",
  "InvitesTable",
  "Nav",
  "NeedsRolePage",
  "NewInviteForm",
  "PasswordField",
  "ResendVerificationButton",
  "ResetPasswordForm",
  "Roles",
  "Sidebar",
  "SignInForm",
  "SignUpForm",
  "ThemeSwitch",
  "Topbar",
  "UserStatus",
  "UsersTable",
  "VerifyEmailButton",
] as const satisfies readonly (keyof Messages)[];

export type ClientMessages = Pick<Messages, (typeof CLIENT_NAMESPACES)[number]>;

export function pickClientMessages(messages: Messages): ClientMessages {
  return Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  ) as ClientMessages;
}
