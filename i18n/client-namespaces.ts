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
  "AccountStatus",
  "AddGuestDialog",
  "ApplicationStatus",
  "ApplicationsBrowser",
  "AssignPendingRole",
  "AuthErrors",
  "CancelInviteButton",
  "ChurchContext",
  "ConfirmDialog",
  "Conversations",
  "DataTable",
  "ErrorState",
  "ForgotPasswordForm",
  "GroupClose",
  "GroupForm",
  "GroupGuestsCard",
  "GroupMembers",
  "GroupMembersCard",
  "GroupsBrowser",
  "GuestForm",
  "GuestRowMenu",
  "GuestsBrowser",
  "GuestsBadge",
  "InviteStatus",
  "InvitesTable",
  "MemberAccountActions",
  "MemberForm",
  "MembersBrowser",
  "MemberStatus",
  "ReactivateMemberDialog",
  "MemberStatusCard",
  "LeaderBlockDialog",
  "DeactivateMemberDialog",
  "Nav",
  "NeedsRolePage",
  "NewInviteForm",
  "NoMeetingDialog",
  "NoMeetingWeek",
  "PasswordField",
  "RemoveGuestDialog",
  "ReportForm",
  "ReportItems",
  "ReportsList",
  "ReportTimeline",
  "ResendVerificationButton",
  "ResetPasswordForm",
  "Roles",
  "Sidebar",
  "SignInForm",
  "SmallGroupRole",
  "SignUpForm",
  "SimilarGuests",
  "ThemeSwitch",
  "Topbar",
  "UserAccountActions",
  "UserCard",
  "UserMemberActions",
  "UserStatus",
  "UsersTable",
  "VerifyEmailButton",
  "Weekdays",
] as const satisfies readonly (keyof Messages)[];

export type ClientMessages = Pick<Messages, (typeof CLIENT_NAMESPACES)[number]>;

export function pickClientMessages(messages: Messages): ClientMessages {
  return Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  ) as ClientMessages;
}
