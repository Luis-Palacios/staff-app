# Report submitted emails: Email notifications section and Watching copy (staff-app)

> **Status (Nov 22, 2026):** Stage 1 built on `feature/report-submitted-emails` and browser-checked
> locally as an admin (see *Browser checks*). Spec: `../docs/specs/report-submitted-emails.md` (rules 9–10, *Contracts → staff-app*).
> membership-management's side (new preferences contract, second kill switch) is merged on `main`
> (PR #73); auth-server's template is merged (PR #36).

Implementation spec for the staff-app side of **report submitted emails**: elders and admins get an
email when a report is submitted in a group they watch. Changes to what Report conversations Part 2
built (`REPORT-CONVERSATIONS-EMAIL.md`):

- **My profile, Notifications card** (`/users/me`): two switches, *Conversations* (was "Conversation
  emails") and *Submitted reports* (new, watch audience only). Each is hidden while the server has
  that kind off (`available`); the card is hidden when no switch is left to show.
- **Watching** (My profile list and `/groups/[id]`): one switch per group for both kinds; disabled
  only when both emails are off. New hints.
- **Places that read the old flag** decide per kind (conversation panel note, prayer panel).

**Decided:** see the spec's rules 9–10. No new design board: the existing card's layout and tokens.

**Depends on the API:** `membership-management` (merged). `GET /me/notification-preferences` →
`{ email: { reportConversation, reportSubmitted }, available: { reportConversation, reportSubmitted } }`;
`PUT` takes `{ email: <any subset> }` and returns the same shape (unknown keys, null or the old
body → 422). Types are hand-written in `api/notifications-api/types.ts`. Watch routes unchanged.

Branch **`feature/report-submitted-emails`**. Each stage: `pnpm lint`, `pnpm exec tsc --noEmit`,
`pnpm build` (regenerates `messages/en.d.json.ts`), then browser checks through `browser-verifier`.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Preferences contract, two switches, Watching copy | ✅ | `7503b8b` |

### Browser checks (Nov 22, 2026, local, both kill switches on)

Passed as an admin (watch audience), en and es, 1440 and 1024 px, dark mode at 1024: the card's
switches and hints, saved positions after reload, Watching switches disabled only with both off
(My profile and `/groups/1`, with the My profile link), conversation and prayer panel notes
unchanged, no horizontal scroll. Not covered: a leader's view (no impersonation in Users; the
`canWatchGroups` gate is unchanged from Part 2), true 390 px (the window stops at 454 px), the PUT
body (server actions hide it), console errors on the first pages.

### Decisions and deviations

- One stage: the contract change, the switches and the copy break type-checking if split.
- "Both emails off" for the Watching switches is computed on **effective** values
  (`available && email`) so a kind switched off at the server can't keep the switches enabled. When
  both kinds are available this is exactly the spec's "both `email` values false".
- My profile: the *Conversations* switch keeps its `canSeeConversationsInbox` gate (the card is for
  people who see conversations); *Submitted reports* and the list need `canWatchGroups`. A watcher
  with conversations off at the server sees only *Submitted reports* and the list.
- A new server action `setSubmittedReportEmails` (checks `canWatchGroups`); both preference actions
  send `{ email: { <kind>: value } }` only.
- `getEmailsEnabled()` is now `getConversationEmailsAvailable()` (= `available.reportConversation`);
  the conversation panel and prayer panel keep their `emailsEnabled` prop. Submitted-report email
  state doesn't affect the panel notes.
- Group page: the card shows while either `available` is true, for watchers; `GroupWatchCard`
  takes `emailsOn` instead of `conversationEmails`.
- `emailsOffGroupHint` keeps its My profile link and gets the spec's wording ("Turn on conversation
  or report emails in My profile to choose groups.").
- Keys renamed in value only (`conversationEmails` → "Conversations" / "Conversaciones"); new keys
  `submittedEmails`, `submittedEmailsHint`.
- `REPORT-CONVERSATIONS-EMAIL.md` still describes the old `emailsEnabled` shape; left as history,
  this handoff supersedes it.

## Copy

| Key (`NotificationSettings.`) | English | Español |
| --- | --- | --- |
| `conversationEmails` | Conversations | Conversaciones |
| `submittedEmails` | Submitted reports | Reportes enviados |
| `submittedEmailsHint` | Get an email when a report is submitted in a group you watch. | Recibe un correo cuando se envíe un reporte en un grupo que sigues. |
| `watchedGroupsHint` | You get emails about leaders’ comments and submitted reports in the groups you watch. Unwatching doesn’t stop emails for conversations you’ve commented in. | Recibes correos sobre los comentarios de los líderes y los reportes enviados en los grupos que sigues. Dejar de seguir un grupo no detiene los correos de conversaciones en las que comentaste. |
| `emailsOffHint` | Turn on conversation or report emails to choose groups. | Activa los correos de conversaciones o de reportes para elegir grupos. |
| `watchingHint` | Get an email when a leader comments in this group’s reports or a report is submitted. | Recibe un correo cuando un líder comente en los reportes de este grupo o se envíe un reporte. |
| `emailsOffGroupHint` | Turn on conversation or report emails in <link>My profile</link> to choose groups. | Activa los correos de conversaciones o de reportes en <link>Mi perfil</link> para elegir grupos. |

## Not in this spec

- A canvas board for the section (add one if the layout changes more than this).
- The email itself and its link (`/groups/reports/{id}`): auth-server and membership-management.
