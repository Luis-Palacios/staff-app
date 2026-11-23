# Report reminder emails: Weekly report reminders switch (staff-app)

> **Status (Nov 23, 2026):** built on `feature/report-reminder-emails`, not yet browser-checked.
> Spec: `../docs/specs/report-reminder-emails.md` (rules 12–14, *Contracts → staff-app*,
> *Implementation order* step 2). membership-management's preferences contract is merged on `main`.

Implementation spec for the staff-app side of **report reminder emails**: active leaders and
co-leaders get a weekly email when an open group they lead has not submitted this week's report.
This adds one switch to what *Report submitted emails* built (`REPORT-SUBMITTED-EMAILS.md`):

- **My profile, Notifications card** (`/users/me`): a third switch, *Weekly report reminders*,
  shown only to someone who leads or co-leads an open group and holds `smallGroups: view` +
  `smallGroupReports: create`, while the server has the kind on (`available.reportReminder`). The
  card is hidden only when all three switches are hidden.

**Decided:** see the spec's rules 12–14. No new design board: the existing card's layout and tokens.
The switch does not touch the Watching list (rule 14).

**Depends on the API:** `membership-management` (merged). `GET /me/notification-preferences` →
`{ email: { reportConversation, reportSubmitted, reportReminder }, available: { …same three } }`,
all required booleans. `PUT` takes `{ email: <any subset> }`; each key is an optional,
non-nullable boolean (null or unknown keys → 422; `{ email: {} }` is a 200 no-op). Any signed-in
user may set it, even while the kill switch is off. `available.reportReminder` is
`REPORT_REMINDER_EMAILS_ENABLED`. Types are hand-written in `api/notifications-api/types.ts` (not
generated).

Branch **`feature/report-reminder-emails`**. Each stage: `pnpm lint`, `pnpm exec tsc --noEmit`,
`pnpm build` (regenerates `messages/en.d.json.ts`), then browser checks through `browser-verifier`.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 0. Handoff (written by the workspace session; the subagent's write was refused) | ✅ | (this commit) |
| 1. Types and server action | ✅ | `2fb74e8` |
| 2. My profile switch and copy | ✅ | `78c83fb` |

### Decisions and deviations

- A shared `REPORT_REMINDER_CHECK` (`smallGroups: view` + `smallGroupReports: create`) in
  `lib/auth/permissions.ts`, used by the server action and `MyNotifications` instead of two inline
  copies.
- `setReportReminderEmails` uses `forbiddenUnless(REPORT_REMINDER_CHECK)` (it can't know whether
  the caller leads a group; the API takes any signed-in user) and revalidates only `/users/me`
  (rule 14: no effect on Watching).
- `MyNotifications` no longer returns early unless the caller sees conversations: it returns null
  only when the caller sees neither conversations nor reminders. `showConversations` and the
  watcher check carry `canSeeConversationsInbox` themselves, so the existing switches and the
  Watching list behave as before. New required prop `leadsGroup`.
- `pnpm build` could not run in the implementing session (SWC native cache ACL error on the
  machine), so `messages/en.d.json.ts` was updated by hand with the two new keys; a normal build
  regenerates it identically. `pnpm build` is still to be run.

## Stage 1: types and server action

**Files:** `api/notifications-api/types.ts`, `lib/auth/permissions.ts`,
`app/(app)/_actions/notification-actions.ts`.

- `EmailKinds` gains `reportReminder: boolean`; doc comment updated.
- `setReportReminderEmails(enabled)`: sends `{ email: { reportReminder: enabled } }`, gated by
  `forbiddenUnless(REPORT_REMINDER_CHECK)`.

## Stage 2: My profile switch and copy

**Files:** `app/(app)/users/me/page.tsx`, `_components/my-notifications.tsx`,
`_components/notifications-card.tsx`, `messages/en.json`, `messages/es.json`,
`messages/en.d.json.ts`.

- `page.tsx` passes `leadsGroup={leadIds.size > 0}` to both `MyNotifications` calls.
- `MyNotifications`: `canReceiveReminders = leadsGroup && can(permissions, REPORT_REMINDER_CHECK)`;
  `showReminders = canReceiveReminders && available.reportReminder`; the card renders when
  `showConversations || showSubmitted || showReminders`.
- `NotificationsCard`: optional `reminderEmails?: boolean` and a third `SettingSwitch` when
  defined. `emailsOn` stays tied only to conversations and submitted reports (rule 14).

## Copy

| Key (`NotificationSettings.`) | English | Español |
| --- | --- | --- |
| `reminderEmails` | Weekly report reminders | Recordatorios semanales de reportes |
| `reminderEmailsHint` | Get a weekly reminder to submit your small group’s report if it hasn’t been submitted yet. | Recibe un recordatorio semanal para enviar el reporte de tu grupo pequeño si aún no ha sido enviado. |

## Not in this spec

- The email, schedule and worker: auth-server and membership-management.
- Changes to the Watching switches or the group page's watch card.
