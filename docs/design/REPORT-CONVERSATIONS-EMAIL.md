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
| 0. Handoff rewritten to the Nov 2026 design | ✅ | `76cb749` |
| 1. Preferences and watch client; My profile switch and Watched groups; Watching on `/groups/[id]` | ✅ | `a4501c4` |
| 2. Panel note: who gets an email | ✅ | (this commit) |
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
- Stage 1 (Nov 22, 2026): Luis waived the step-by-step mode for this repo's front-end ("I mostly
  wanted to learn the back-end"); Claude Code writes each stage whole, still one commit per stage
  when Luis says it's done.
- Stage 1: the canvas has **no boards** for the Watching switch or the My profile list (the watcher
  email variants are there, as `reason: watcher` on `Email-NewComment` / `Email-NewReply`). Built
  from the existing cards: My profile gets a **Notifications** card (eyebrow "Email") in the right
  column, under *Sign-in details* (not linked: under *Member profile*), holding the global switch and,
  for watchers, the *Watched groups* list; `/groups/[id]` gets the same card, with the Watching
  switch only, under *When & where*. Shown for closed groups too (rule 13).
- Stage 1: the full-scope audience is `WATCH_GROUPS_CHECK` / `canWatchGroups()` in
  `lib/auth/permissions.ts` (the four permissions of the API's shared check); the watch action uses
  the same check with `forbiddenUnless()`. The preferences action checks `canSeeConversationsInbox`,
  the same condition that shows the switch (the API itself takes any signed-in user).
- Stage 1: one client namespace, **`NotificationSettings`**, for both pages, instead of the guessed
  `MyProfile.*` / `GroupDetail.*`. `saveFailed` dropped: a failed save shows
  `getApiErrorMessage()`'s text (as the rest of the app). Added `eyebrow`, `watchedGroupsLoadFailed`
  and `emailsOffGroupHint` (with a link to My profile).
- Stage 1: failures: a failed preferences call hides the card (the kill switch is unknown); a failed
  watched-groups call keeps the card with an error in place of the list; on the group page either
  failure leaves the card out. Files: `api/notifications-api/`, `app/(app)/_actions/notification-actions.ts`,
  `components/setting-switch.tsx` (`SettingSwitch`, `useSavedToggle`: optimistic, reverts on
  failure, a toggle waits while a save runs), `users/me/_components/my-notifications.tsx` +
  `notifications-card.tsx`, `groups/[id]/_components/group-watch-card.tsx`.
- Stage 1: HeroUI dims a disabled switch's `Description`, which made the group page's "emails are
  off… My profile" hint unreadable; that hint is `SettingSwitch`'s `note` (outside the switch, normal
  muted contrast). A disabled watch switch still shows its saved position. Dark mode's off track
  is low-contrast against the card: HeroUI's `--default`, left as is (a token change, not this spec).
- Stage 1 checks (browser-verifier; the window wouldn't resize, so 1024/390 ran in same-origin
  iframes): admin (all 7 groups, persistence, emails-off disabling, group page card and link, ES,
  dark), group 1's leader (only the global switch, no card on `/groups/1`, 390, dark). Console clean.
- Stage 2: `emailsEnabled` reaches the panel as a prop from its two servers (Report detail, only when
  a panel can open; the Prayer & follow-up panel), through `getEmailsEnabled()` (cached; a failed
  call counts as off, so the note falls back to who sees it, always true). The viewer's side is
  `smallGroups: all` (rule 6) from `usePermissions()`. All four email notes use the mail icon
  (`EnvelopeIcon`; the composer's `noteIcon`), the leaders' one included now that watchers get an
  email; with emails off the note and eye icon are unchanged. Names aren't listed: the staff app
  can't know the recipients after throttling, opt-outs and unwatching, and a general sentence is
  always true. The canvas's `ThreadPanel` still shows the old leaders' note ("No email is sent",
  eye icon) and names in the other notes; its board needs the new wording.
- Stage 2 checks (browser-verifier, read-only): admin on a new, an open, a resolved person thread
  and a resolved prayer thread (texts, envelope icon, ES, 1629 / 1024 / 390 in iframes, dark);
  group 1's leader on a new and an open thread (texts, icon, ES). Not checked live: the emails-off
  fallback (needs the API restarted with the kill switch off). During the admin run the verifier
  mis-clicked **Reopen** on thread 6 (report 4, member 46); no outbox event (reopen without a
  comment sends nothing), the thread was left open (dev data).

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
Stage 1 (as built): `NotificationSettings` (client namespace) holds `eyebrow` (Email · Correo),
`title` (Notifications · Notificaciones), `conversationEmails`, `conversationEmailsHint`,
`watchedGroupsTitle`, `watchedGroupsHint`, `emailsOffHint`, `watchedGroupsLoadFailed`,
`closedGroup`, `watching`, `watchingHint`, `emailsOffGroupHint`; text in `messages/en.json` /
`es.json`.

| Key | English | Español |
| --- | --- | --- |
| `Conversations.emailNoteNew` / `emailNoteLeaderNew` / `emailNoteReply` / `emailNoteResolved` | (table in Stage 2) | (table in Stage 2) |

Stage 2 kept these four names (the `Conversations` namespace, already a client one).

## Not in this spec

- A one-click unsubscribe link in the email (needs a signed token).
- Per-thread muting (per-group is Watching, above).
- Push notifications (a later channel; Watching is channel-neutral, rule 22).
