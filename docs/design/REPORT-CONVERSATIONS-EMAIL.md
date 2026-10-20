# Report conversations, Part 2: email settings and landing (staff-app)

Implementation spec for the staff-app side of **conversation emails** (My profile `/users/me`, the
conversation panel, and links arriving from an email). The emails themselves are sent by
auth-server and planned by membership-management:

- **My profile:** a "Conversation emails" switch (on by default), hidden while emails are off on the
  server.
- **Panel note:** the composer's note says who will get an email, once emails are on.
- **Email links** (`/groups/reports/{id}?person={memberId}`) land on the open panel, also for a
  signed-out user after signing in, and on a phone without flashing the desktop panel first.
- **Language:** picking a language in the account menu also saves it on the user (auth-server
  stores `locale`), so emails go out in that language.

> **How to work this handoff (learning mode).** Claude Code shows **one code change at a time**,
> explains it and waits. Luis decides per change whether he writes it (Claude Code reviews) or
> Claude Code writes it. One commit per stage, when Luis says it's done.

**Decided:** see `../docs/specs/report-conversations.md` (*Contracts (Part 2: email)*). No comment
text or member names in emails; the opt-out lives in My profile; it's per user, not per group.

**Depends on the API:** `membership-management/docs/REPORT-CONVERSATIONS-EMAIL-API-HANDOFF.md`
Stage 6 (preferences endpoints) for stages 1 and 2 here. Stage 3 needs nothing new. Stage 4 needs
auth-server Stage 1 (`locale` on the user).

Branch **`report-conversations-email`**. Each stage: `pnpm lint`, `pnpm exec tsc --noEmit`, light
and dark, 1440 / 1024 / 390, English and Spanish.

- **Design:** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1), page "Report
  conversations": `ReportDetail-ThreadNew`, `ReportDetail-Thread`, `ReportDetail-Thread-Leader`
  (the composer notes with the mail icon); `Email-NewComment` / `Email-NewReply` show what the link
  is for. The My profile switch has no board: follow the existing My profile cards.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Preferences client and My profile switch | ⬜ | |
| 2. Panel note: who gets an email | ⬜ | |
| 3. Email links: sign-in return and the phone panel | ⬜ | |
| 4. Save the language pick on the user | ⬜ | |

### Decisions and deviations

- (fill in per stage)

## Stage 1: Preferences client and My profile switch

- `getNotificationPreferences()` / `updateNotificationPreferences({ conversationEmails })` in the
  members (or conversations) API client; a server action for the update.
- My profile: a "Notifications" card (or a row in the account card; pick what fits the page) with a
  HeroUI `Switch`: **Conversation emails**, description "Get an email when someone comments in a
  conversation you’re part of, or asks about someone in a group you lead." Shown only when
  `emailsEnabled` and the user can see conversations (`canSeeConversationsInbox`). Saves on toggle,
  optimistic, reverts with an inline error on failure.

## Stage 2: Panel note

When `emailsEnabled` (from the preferences call, cached per request), the composer note under the
textarea uses the mail icon and says who gets an email, instead of `audienceNote`:

| Situation | English | Español |
| --- | --- | --- |
| Elders' side, no thread yet | The group’s leaders get an email saying you commented. What you write stays in ekklesiaio. | Los líderes del grupo reciben un correo avisando que comentaste. Lo que escribes se queda en ekklesiaio. |
| Leaders' side, no thread yet | Elders will see this on the report and in Conversations. No email is sent. | Los ancianos lo verán en el reporte y en Conversaciones. No se envía ningún correo. |
| Reply | The others in this conversation get an email saying you replied. | Los demás en esta conversación reciben un correo avisando que respondiste. |
| Reply on a resolved thread | Replying reopens it. The others in this conversation get an email. | Responder la vuelve a abrir. Los demás en esta conversación reciben un correo. |

Names aren't listed (the boards show them, but the staff app doesn't know the exact recipients after
throttling and opt-outs; a general sentence is always true). Note this under *Decisions*.

## Stage 3: Email links

- **Signed out:** following `/groups/reports/812?person=1207` must land there after sign-in, query
  string included. Check what the sign-in redirect keeps today (`proxy.ts` / the sign-in page's
  callback); fix it if it drops `?person=`. Only same-origin relative paths are accepted as the
  return target.
- **Phone:** `useIsDesktop` in `conversation-panel.tsx` assumes desktop on the server
  (`getServerSnapshot` → `true`), so a phone opening an email link first renders the desktop panel
  and then switches to the sheet. Render **neither** shell until the client knows the width (server
  snapshot `null`, render nothing while null; the page under it is unchanged). Check that focus still
  lands on the heading once the shell appears.
- Opening from an email marks the thread read, the same as from the table (no change expected; check
  it).

## Stage 4: Save the language pick

`setLocale` (`app/(app)/_actions/set-locale.ts`) keeps writing the cookie and also calls
auth-server's `update-user` with `{ locale }` for a signed-in user. A failure there is logged and
ignored (the cookie still drives the UI).

## Copy

| Key | English | Español |
| --- | --- | --- |
| `MyProfile.notificationsTitle` | Notifications | Notificaciones |
| `MyProfile.conversationEmails` | Conversation emails | Correos de conversaciones |
| `MyProfile.conversationEmailsHint` | Get an email when someone comments in a conversation you’re part of, or asks about someone in a group you lead. | Recibe un correo cuando alguien comente en una conversación en la que participas, o pregunte por alguien de un grupo que lideras. |
| `MyProfile.saveFailed` | Couldn’t save. Try again. | No se pudo guardar. Inténtalo de nuevo. |
| `Conversations.emailNoteNew` / `emailNoteLeaderNew` / `emailNoteReply` / `emailNoteResolved` | (table in Stage 2) | (table in Stage 2) |

Use the real namespace names where these guessed ones differ; note it.

## Not in this spec

- A one-click unsubscribe link in the email (needs a signed token).
- Per-group or per-thread muting.
- Push notifications.
