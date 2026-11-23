# Report reminder emails: Weekly report reminders switch (staff-app)

> **Status (Nov 23, 2026):** built on `feature/report-reminder-emails` and browser-checked locally.
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
| 0. Handoff (written by the workspace session; the subagent's write was refused) | ✅ | `6fb4743` |
| 1. Types and server action | ✅ | `2fb74e8` |
| 2. My profile switch and copy | ✅ | `78c83fb` |
| Review fix: `leadsGroup` from open-group periods, not `leadIds` | ✅ | `6cc65f4` |
| Browser checks and build recorded | ✅ | `bc8db7e` |
| PR #112 bot review: hide the Watched groups list when only reminders show; client doc comment | ✅ | commit after `bc8db7e` |

### Browser checks (Nov 23, 2026, local, `browser-verifier`)

Signed in as an Admin linked to a member who leads GP - #6 (open). `CONVERSATION_EMAILS_ENABLED`
on, `REPORT_SUBMITTED_EMAILS_ENABLED` off.

| # | Check | Result |
| --- | --- | --- |
| 1 | Kill switch on: card shows *Conversations*, *Weekly report reminders* (on by default) and the Watched groups list; no *Submitted reports* | PASS |
| 2 | English copy, exact (curly apostrophes) | PASS |
| 3 | Spanish copy, exact | PASS |
| 4 | Toggle off → reload → off; on → reload → on; no error text | PASS |
| 5 | Watching list: reminders on/off never changes its enabled state or hint; conversations off disables it ("Turn on conversation or report emails to choose groups."), and reminders don't re-enable it | PASS |
| 6 | Layout: no horizontal scroll at 390/454/1024 (same-origin iframes, es); Spanish hint wraps inside the row; dark theme | PASS (partial: the window couldn't be resized, light mode not seen) |
| 7 | Kill switch off (API restarted): no *Weekly report reminders*, *Conversations* and Watching unchanged | PASS |
| 8 | Console errors / failed requests | PASS (none) |

Not checked: the switch's pending frame, light mode, real 390/1440 viewports, roles other than
Admin, a non-leader, and a former leader of a closed group (the case the review fix covers; it
follows from `member.smallGroups` holding only current periods). The first kill-switch-off run
"failed" because `fastapi dev` printed *Reloading* after `main.py` was touched but kept the old
process serving; a full restart of the API fixed it (environment, not code).

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
  Watching list behave as before. New required prop `leadsGroup`. The Watched groups list is read
  and shown only when *Conversations* or *Submitted reports* shows (PR #112 bot review): before,
  the early return guaranteed it; now a card can hold only *Weekly report reminders*, and the list
  would otherwise render disabled with no switch to turn it on.
- `pnpm build` could not run in the implementing session (SWC native cache ACL error on the
  machine), so `messages/en.d.json.ts` was updated by hand with the two new keys; a normal build
  regenerates it identically. `pnpm build` was then run from the user's own terminal (the SWC
  error comes from the agent sandbox, not the code): it passes, and `pnpm dev` left
  `messages/en.d.json.ts` unchanged.

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

- `page.tsx` passes `leadsGroup`: `false` without a linked member, otherwise whether
  `member.smallGroups` (current periods only) has a `leader` or `co_leader` row. **Deviation from
  the spec's contract text** (`leadIds.size > 0`): `leadIds` comes from `GET /me` `leads`, which also
  keeps groups the person led when they closed (the read scope), so a former leader would see a
  switch the worker never honours (rule 5). Rule 13 ("actively leads or co-leads an open group")
  wins; the spec line is corrected in the workspace.
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
