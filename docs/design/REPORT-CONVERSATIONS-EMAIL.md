# Report conversations, Part 2: email settings and landing (staff-app)

> **Status (Nov 22, 2026):** rewritten in Stage 0 to the spec's Nov 2026 design
> (`../docs/specs/report-conversations.md`, *Changes to the Part 2 handoffs (Nov 2026)*, staff-app
> bullet) and `../docs/specs/prayer-follow-up.md` (*Changes for report conversations Part 2*). The
> API side (membership-management PR #72, migration `b453135219c0`) and auth-server's side (PR #35:
> templates, `locale` on the user, filled on session refresh too) are merged on `main`.

Implementation spec for the staff-app side of **conversation emails** (My profile `/users/me`, the
group page, the conversation panel, and links arriving from an email). The emails themselves are
planned and queued by membership-management and sent by auth-server:

- **My profile:** a "Conversation emails" switch (on by default). For elders and admins (the
  full-scope audience), a **Watched groups** list below it, with a Watching switch per group. All of
  it is hidden while emails are off on the server (`emailsEnabled: false`).
- **Group page `/groups/[id]`:** the same Watching switch, for the full-scope audience, only while
  emails are on.
- **Panel note:** the composer's note says who will get an email, once emails are on.
- **Email links** (`/groups/reports/{id}?person={memberId}`, `?guest={guestId}` or
  `?section=prayer|praise|followUp`) land on the open panel, also for a signed-out user after signing
  in, and on a phone without flashing the desktop panel first.
- **Language:** picking a language in the account menu also saves it on the user (auth-server
  stores `locale`), so emails go out in that language; `getSession()` forwards `accept-language` so
  auth-server can fill `locale` on session refresh for users who never use the picker.

> **How to work this handoff (learning mode).** Claude Code shows **one code change at a time**,
> with the code and a short why, then **waits**. Luis decides per change: he writes it himself and
> Claude Code reviews it like a PR comment (what's right, what's wrong, why), or he says "you write
> it". Never batch changes. Commits stay one per stage, made only when Luis says the stage is done,
> with this progress log updated in the same commit. Stop after every stage and before any PR. Docs
> changes don't need the step-by-step review.

**Decided:** see `../docs/specs/report-conversations.md` (*Watching groups*, rules 18–23, and
*Contracts (Part 2: email)* → *Settings, language, switches*). No comment text or member names in
emails; the opt-out lives in My profile; it's **per user, plus per group for watchers**.

- **Watchers** are the full-scope audience (elders and admins): they watch **every group by
  default**, closed ones and groups created later included. Only opt-outs are stored. Leaders have
  no watch setting (they're always emailed about their own groups) and only see the global switch.
- Unwatching a group doesn't stop **participant** emails for threads you've commented in, and changes
  nothing in the app (inbox, badge, dashboards).
- The global "Conversation emails" switch wins over everything: off means no conversation emails.
  While it's off, the Watching switches stay visible but **disabled**, with a hint to turn emails on
  (decided with Luis, Stage 0).
- Kill switch (`emailsEnabled: false`): every email and watch switch is hidden. The preference routes
  still answer and keep a choice made earlier.

**Depends on the API** (membership-management, merged; detail in
`membership-management/docs/REPORT-CONVERSATIONS-EMAIL-API-HANDOFF.md`, Stage 6 and *Decisions and
deviations*):

| Route | Who | Shape |
| --- | --- | --- |
| `GET /me/notification-preferences` | any signed-in user | `{ conversationEmails, emailsEnabled }` (`emailsEnabled` = the server's kill switch) |
| `PUT /me/notification-preferences` | any signed-in user | body `{ conversationEmails }` → same shape |
| `GET /me/watched-groups` | full-scope audience, else 403 | `{ items: [{ smallGroupId, name, closed, watching }] }`, every group, open first then by name |
| `PUT /small-groups/{id}/watch` | full-scope audience, else 403; unknown group 404 | body `{ watching }` → `{ smallGroupId, watching }` |

The watch routes check the audience **before** the group lookup (403 before 404). `PUT` routes are
rate limited (20/minute). Stage 4 uses auth-server's `update-user` with `{ locale }` (PR #35).
Nothing here may be stubbed: if something is missing, stop and say so.

Branch **`feature/report-conversations-email`** (the spec's older `report-conversations-email`
predates the branch naming rule). Each stage: `pnpm lint`, `pnpm exec tsc --noEmit`, light and dark,
1440 / 1024 / 390, English and Spanish, browser checks through the `browser-verifier` agent.

- **Design:** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1), page "Report
  conversations": `ReportDetail-ThreadNew`, `ReportDetail-Thread`, `ReportDetail-Thread-Leader`
  (the composer notes with the mail icon); `Email-NewComment` / `Email-NewReply` show what the link
  is for. Check in Stage 1 whether boards exist for the Watching switch and the My profile list; if
  not, follow the existing My profile cards and the group page's header/details, and report the gap.
- **Testing:** local emails need `CONVERSATION_EMAILS_ENABLED=true` and `INTERNAL_API_TOKEN` equal to
  auth-server's in `membership-management/.env`, and auth-server's real send-only Resend key. A send
  reaches a real inbox: only Luis's test accounts (ask for N). Never put an email address in a
  command, a log or this file: use user ids. The test group, elder and leader are set up again on
  the Mac (the Windows setup didn't move).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 0. Handoff rewritten to the Nov 2026 design | ✅ | (this commit) |
| 1. Preferences and watch client; My profile switch and Watched groups; Watching on `/groups/[id]` | ⬜ | |
| 2. Panel note: who gets an email | ⬜ | |
| 3. Email links: sign-in return and the phone panel (`?person=`, `?guest=`, `?section=`) | ⬜ | |
| 4. Language: save the pick on the user; `getSession()` forwards `accept-language` | ⬜ | |

### Decisions and deviations

- Stage 0: rewritten around watching (rules 18–23) and section/guest threads. Changes from the old
  handoff: Stage 1 gains the watch client, the Watched groups list and the group page switch; the
  leaders'-side panel note says "Elders watching this group get an email" instead of "No email is
  sent"; *Decided* is "per user, plus per group for watchers"; Stage 3 keeps `?guest=` and
  `?section=` as well as `?person=`; Stage 4 adds `accept-language` in `getSession()` (spec, *Added
  Nov 21, 2026*). Watch switches are disabled (not hidden) while the global switch is off. Where the
  Watching switch sits on `/groups/[id]` is decided in Stage 1 from the canvas.

## Stage 1: Preferences and watch client; My profile; group page

- **Client:** `getNotificationPreferences()`, `updateNotificationPreferences({ conversationEmails })`,
  `getWatchedGroups()` and `setGroupWatching(groupId, watching)` in the members API client (or a new
  `notifications` one; pick what fits). Server actions for the two writes, each checking the
  permission before calling the API (`forbiddenUnless()`), mapping API errors with
  `getApiErrorMessage()`.
- **Who is the full-scope audience here:** the same four permissions the API's shared check needs
  (`smallGroups: all`, `smallGroups: view`, `smallGroupReports: view`,
  `smallGroupReports: viewObservations`), checked with `can()`. Never role names. Name the check once
  (e.g. in `lib/auth/`) and use it on both pages; a 403 from the API still hides the UI.
- **My profile:** a "Notifications" card (or a row in the account card; pick what fits the page) with
  a HeroUI `Switch`: **Conversation emails**, description "Get an email when someone comments in a
  conversation you’re part of, or asks about someone in a group you lead." Shown only when
  `emailsEnabled` and the user can see conversations (`canSeeConversationsInbox`).
- **Watched groups** (full-scope audience only, under the same `emailsEnabled` condition): every group
  from `GET /me/watched-groups`, open first, closed ones marked with `StatusBadge`, one Watching
  `Switch` each. A hint: unwatching doesn't stop emails for conversations you've commented in. While
  Conversation emails is off, the switches are disabled with a hint to turn emails on.
- **`/groups/[id]`:** a Watching switch for that group, same conditions. Placement (header actions or
  the details card) from the canvas.
- Every switch saves on toggle, optimistic, and reverts with an inline error on failure.

## Stage 2: Panel note

When `emailsEnabled` (from the preferences call, cached per request), the composer note under the
textarea uses the mail icon and says who gets an email, instead of `audienceNote`. The same notes
apply to person, guest and section threads:

| Situation | English | Español |
| --- | --- | --- |
| Elders' side, no thread yet | The group’s leaders get an email saying you commented. What you write stays in ekklesiaio. | Los líderes del grupo reciben un correo avisando que comentaste. Lo que escribes se queda en ekklesiaio. |
| Leaders' side, no thread yet | Elders watching this group get an email saying you commented. What you write stays in ekklesiaio. | Los ancianos que siguen este grupo reciben un correo avisando que comentaste. Lo que escribes se queda en ekklesiaio. |
| Reply | The others in this conversation get an email saying you replied. | Los demás en esta conversación reciben un correo avisando que respondiste. |
| Reply on a resolved thread | Replying reopens it. The others in this conversation get an email. | Responder la vuelve a abrir. Los demás en esta conversación reciben un correo. |

Names aren't listed (the boards show them, but the staff app doesn't know the exact recipients after
throttling, opt-outs and unwatching; a general sentence is always true). Note this under *Decisions*.

## Stage 3: Email links

- **Signed out:** following `/groups/reports/812?person=1207` (or `?guest=…`, `?section=prayer`) must
  land there after sign-in, query string included. Check what the sign-in redirect keeps today
  (`proxy.ts` / the sign-in page's callback); fix it if it drops the query. Only same-origin relative
  paths are accepted as the return target.
- **Phone:** `useIsDesktop` in `conversation-panel.tsx` assumes desktop on the server
  (`getServerSnapshot` → `true`), so a phone opening an email link first renders the desktop panel
  and then switches to the sheet. Render **neither** shell until the client knows the width (server
  snapshot `null`, render nothing while null; the page under it is unchanged). Check it for a person,
  a guest and a section link, and that focus still lands on the heading once the shell appears.
- Opening from an email marks the thread read, the same as from the table (no change expected; check
  it).

## Stage 4: Language

- `setLocale` (`app/(app)/_actions/set-locale.ts`) keeps writing the cookie and also calls
  auth-server's `update-user` with `{ locale }` for a signed-in user. A failure there is logged and
  ignored (the cookie still drives the UI).
- `getSession()` (`api/auth-api/client.ts`) forwards `accept-language` as well as `cookie`, from every
  caller (`proxy.ts` included), so auth-server's session-refresh path can fill `locale` for users who
  never used the picker.

## Copy

| Key | English | Español |
| --- | --- | --- |
| `MyProfile.notificationsTitle` | Notifications | Notificaciones |
| `MyProfile.conversationEmails` | Conversation emails | Correos de conversaciones |
| `MyProfile.conversationEmailsHint` | Get an email when someone comments in a conversation you’re part of, or asks about someone in a group you lead. | Recibe un correo cuando alguien comente en una conversación en la que participas, o pregunte por alguien de un grupo que lideras. |
| `MyProfile.watchedGroupsTitle` | Watched groups | Grupos que sigues |
| `MyProfile.watchedGroupsHint` | Get an email when a leader comments in a group you watch. Unwatching doesn’t stop emails for conversations you’ve commented in. | Recibe un correo cuando un líder comente en un grupo que sigues. Dejar de seguirlo no detiene los correos de las conversaciones en las que comentaste. |
| `MyProfile.emailsOffHint` | Turn on conversation emails to choose groups. | Activa los correos de conversaciones para elegir grupos. |
| `MyProfile.closedGroup` | Closed | Cerrado |
| `MyProfile.saveFailed` | Couldn’t save. Try again. | No se pudo guardar. Inténtalo de nuevo. |
| `GroupDetail.watching` | Watching | Siguiendo |
| `GroupDetail.watchingHint` | Get an email when a leader comments in this group’s reports. | Recibe un correo cuando un líder comente en los reportes de este grupo. |
| `Conversations.emailNoteNew` / `emailNoteLeaderNew` / `emailNoteReply` / `emailNoteResolved` | (table in Stage 2) | (table in Stage 2) |

Use the real namespace names where these guessed ones differ; note it.

## Not in this spec

- A one-click unsubscribe link in the email (needs a signed token).
- Per-thread muting (per-group is Watching, above).
- Push notifications (a later channel; Watching is channel-neutral, rule 22).
