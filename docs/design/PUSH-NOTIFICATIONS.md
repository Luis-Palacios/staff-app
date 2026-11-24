# Notifications, Part 2: Web Push in My profile and the service worker (staff-app)

Implementation spec for the staff-app side of **Web Push**. Cross-repo spec:
`../docs/specs/notifications.md`, **Part 2, Implementation order step 5** (rules 7, 17, 19, 21, 22,
23, 24, the *Copy* rows for the grid and the device row, and *Contracts (Part 2: push) → staff-app*).
Part 1 (bell, list, page badge) is `NOTIFICATIONS.md` and is merged.

- **`public/sw.js`:** handles `push` and `notificationclick` only. No cache, no `fetch` handler. A push
  shows a notification and sets the app badge; a click focuses a window or opens one at
  `/notifications/open/{notificationId}` (or `path` when it is null).
- **The *This device* row** in My profile's Notifications card, one state at a time (not supported,
  iPhone/iPad not installed, not asked yet, on, blocked), hidden while push is off at the server.
- **The email/push grid:** one row per kind, columns Email · Push, under today's rules for who sees
  which kind; a cell is hidden while its channel is off at the server for that kind.
- **Sign-out cleanup:** both sign-out places delete this browser's subscription first.
- Nothing asks for permission on load (rule 19).

**Decided** (cross-repo spec, don't reopen): the rules above and the copy tables. The VAPID public
key is read at runtime from `GET /api/push/config`, never from a `NEXT_PUBLIC_` variable.

**Depends on the APIs** (both built, PRs open): `auth-server/docs/PUSH-NOTIFICATIONS-HANDOFF.md`,
`membership-management/docs/PUSH-NOTIFICATIONS-API-HANDOFF.md`. Nothing is stubbed.

| Call | Where | Notes |
| --- | --- | --- |
| `GET /api/push/config` → `{ enabled, publicKey \| null }` | auth-server, session cookie | 401 without a session. `publicKey` is base64url, 65 bytes uncompressed P-256 (87 chars) |
| `PUT /api/push/subscriptions` `{ endpoint, keys: { p256dh, auth } }` → 204 | auth-server | Upsert by endpoint (moves it to the caller). 404 `push_disabled`, 422 `invalid_request` / `invalid_endpoint` |
| `DELETE /api/push/subscriptions` `{ endpoint }` → 204 | auth-server | Idempotent, works with push off |
| `GET /me/notification-preferences` → `{ email, available, push, availablePush }` | membership-management, JWT | `availablePush[k]` = kind flag AND push flag |
| `PUT /me/notification-preferences` `{ email?, push? }` | membership-management, JWT | Any subset of the three keys under each |

The push message the service worker receives (JSON): `{ title, body, path, tag, notificationId:
number | null, badgeCount }`. `tag` is the delivery's idempotency key; title and body are already in
the recipient's language.

Work through it **stage by stage**, one reviewable commit per stage, on the **`feature/notifications-push`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) before the next
starts; the last also builds. A stage's hash is filled in by the next stage's commit (a commit can't
contain its own hash).

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Profile": `NotificationsCard` (tweaks `push`, `device`, `reminderPush`), `MyProfile`, the
  `MyProfile-Push-*` boards and the sticky note "Notifications, Part 2 (Web Push)".
  Mirrored in `design-canvas/project/`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 0. This handoff | ✅ | `75a93fe` |
| 1. API clients, types, server actions | ✅ | `bd0ca3f` |
| 2. Service worker, registration, headers | ✅ | `78c6428` |
| 3. The *This device* row | ✅ | `d60fe30` |
| 4. The email/push grid and rule 7 | ✅ | `9061de8` |
| 5. Sign-out cleanup and docs | ✅ | `c210943` |
| Review fixes | ✅ | `c452e2e` |

**Status: built, reviewed and browser-checked, with a real push received** (Nov 23, 2026). `pnpm lint`,
`pnpm exec tsc --noEmit` and `pnpm build` pass.

### Browser checks (Nov 23, 2026, local, `browser-verifier`, Chrome)

Signed in as an admin; auth-server with push on and a dev VAPID pair; membership-management with
`PUSH_NOTIFICATIONS_ENABLED`, in-app and two kind flags on. Notifications were allowed for
`localhost:3001` in Chrome's settings beforehand (the verifier can't click the permission prompt).
The window didn't resize: 390 was checked in a same-origin iframe.

| Check | Result |
| --- | --- |
| `/sw.js` registered and active, scope `/`, no caches, served `no-cache, no-store, must-revalidate`, JavaScript (no sign-in redirect) | PASS |
| Card, 1536 light en: "Email & push", *This device* band above the Email · Push grid, helper, channel-neutral row hints, switch names "Conversations, Email" … | PASS |
| *Turn on* (permission already granted): no prompt, "On for this device" + "Turn off", stays On after reload, endpoint on `fcm.googleapis.com` | PASS |
| Spanish, dark, 390: "Correo y push", "Este dispositivo", "Activadas en este dispositivo", "Desactivar", columns, helper; no horizontal scroll | PASS |
| *Submitted reports, Push* saves off and back on across reloads | PASS |
| **Real push**: `POST /internal/notifications` (channel push) → auth-server → FCM → this Chrome: `200 {"sent":1}` in 868 ms; the service worker showed "SGLA Beta submitted its report" / "Wed, Oct 14 · 9 of 12 attended · by Ana Díaz", tag `real-push-1`, data `{ path, notificationId: null }`. The same key again: `200 {"sent":1}` in 80 ms with no second push (`push_sends`) | PASS |
| Badging API present (`navigator.setAppBadge`) | PASS |
| Console errors | none (after restarting a membership-management dev server that was serving old code) |

Not checked: *Turn off* (the device started off and was left on), clicking the OS notification (the
verifier can't reach OS UI), the iOS hint and an installed iOS/iPadOS app (needs a real device over
HTTPS), Firefox's click behaviour, sign-out cleanup (the verifier never signs out), and the push
coming from a real membership-management event rather than a direct call to auth-server.

### Decisions and deviations

- **Service worker:** `badge` is `/icons/icon-monochrome-512.png` (the existing monochrome icon);
  `icon` is `icon-192.png`. It calls `skipWaiting()` and `clients.claim()` so a fixed worker takes
  over at once (nothing is cached, so nothing to migrate). A push without a title still shows one
  (the app name), because browsers require every push to show something. `/sw.js` gets
  `Cache-Control: no-cache, no-store, must-revalidate` from `next.config.mjs` `headers()`.
  `proxy.ts` is unchanged: its matcher already skips `/sw.js` (a path with a dot).
- **Click:** an open same-origin window is `navigate()`d then focused; if that throws, a new window
  opens. A non-integer `notificationId` falls back to `path`, and a `path` that isn't a single-slash
  relative path to `/`.
- **Granted but not subscribed** (after *Turn off*, or the browser dropped it, or a different key):
  the row shows *Turn on* rather than silently subscribing, since a silent resubscribe on load would
  undo *Turn off*. It needs no prompt (already granted), only the tap.
- **Re-registering on load:** the first look at a device that is on PUTs its subscription again. A
  failure there is ignored: the row stays *On*. The row also re-reads its state when the window gets
  focus (someone who unblocked the site in browser settings "comes back").
- **Turn off:** auth-server first, then `unsubscribe()`. If the DELETE fails the row stays *On* with
  an error, so a server row that keeps sending here never outlives the local state.
- **Register on `getPushRegistration()`:** the row calls `register()` again (idempotent) before
  `ready`, so it never waits on a worker whose shell registration failed.
- **Grid:** the Email column goes when it's off for every kind shown, the Push column likewise; with
  no Push column the card is today's email-only card, unchanged (including its hints and the
  "Email" eyebrow). *This device* shows only when auth-server says push is on **and** a Push column
  shows (otherwise there would be nothing for the device to receive). Row labels reuse
  `conversationEmails`, `submittedEmails`, `reminderEmails` (their text is the kind name).
- **Rule 7 on the group page:** `GroupWatchCard` takes `channelsOn` (an email or push switch for
  conversations or submitted reports is on and available) in place of `emailsOn`, and the card
  shows while any of the four is available. Its hint when everything is off still says "Turn on
  conversation or report emails in My profile" (the boards say Watched groups is unchanged; a
  channel-neutral wording is a design call).
- **New copy not on the boards:** `deviceTurnOnFailed` and `deviceTurnOffFailed` (errors under the
  row). Everything else is the boards' text.
- **iOS hint:** one ICU message with `<b>` and an empty `<share></share>` tag that renders the
  Share glyph, so the sentence stays whole for translators.
- No new tokens: the band is `bg-surface-secondary` (board `#F7F8FA`), status colours are
  `success-soft-foreground` / `warning-soft-foreground` / `muted`.

### Review (spec-reviewer, Opus): no blockers. Fixed on the branch

1. **Notification click:** `sw.js` now focuses the tab first, then navigates it. Browsers allow a
   worker to focus or open a window only briefly after the click (Firefox about 1 s), and
   `navigate()` waits for the page, so focusing after it could fail and open a second window. It
   picks the focused or visible tab, and opens a window only when there is none or `navigate()`
   throws (an uncontrolled page).
2. **Sign-out:** `unsubscribe()` now always runs (`finally`), even when the server call throws. A
   stale server row then gets 410 from the push service and auth-server deletes it, so the device
   never shows the old account's pushes. The timeout timer is cleared.
3. ***This device* row:** a focus refresh is ignored while *Turn on* / *Turn off* runs (the
   permission prompt closing gives the window focus), so it can't show *On* for a subscription the
   tap then undoes.
4. **Click target:** the path is parsed and must keep the app's origin (a prefix check alone lets
   `"/\t/evil.example"` through, since URL parsing drops the tab). auth-server's path patterns already
   block it; this is defence in depth.
5. **Errors under a grid row:** shown once when email and push fail with the same text (they
   duplicated a React key).
- Accepted: the all-off hints still name emails only (a design call, on both My profile and the
  group page); the sign-out buttons show no pending state during the at most 4 s cleanup; with
  membership-management's push flag off but auth-server's on, a device that is on can't be turned
  off from the profile (sign-out still removes it).

## Token changes

None expected: the boards use existing tokens. The *This device* band is `surface-secondary`; the
board's `#F7F8FA` tint is nearly it. If a board needs a token that doesn't exist, it is listed here.

## Stage 1: API clients, types, server actions

**Files:** `api/auth-api/client.ts`, `api/auth-api/types.ts`, `api/notifications-api/types.ts`,
`api/notifications-api/client.ts`, `app/(app)/_actions/push-actions.ts`,
`app/(app)/_actions/notification-actions.ts`.

- auth-server: `getPushConfig`, `putPushSubscription`, `deletePushSubscription`, session cookie and
  Origin forwarded like the invite calls.
- membership-management: `NotificationPreferences` gains `push` and `availablePush`;
  `updateNotificationPreferences` takes `{ email?, push? }`.
- Server actions: `loadPushConfig`, `savePushSubscription`, `removePushSubscription`, and one per
  push switch (`setConversationPush`, `setSubmittedReportPush`, `setReportReminderPush`), with the
  same permission checks as the email ones.

## Stage 2: Service worker, registration, headers

**Files:** `public/sw.js`, `next.config.mjs`, `components/push/register-service-worker.tsx`,
`components/app-shell.tsx`.

- `sw.js`: `push` → `showNotification` + badge; `notificationclick` → close, focus/navigate or open.
  Same-origin relative paths only. No `fetch` listener, no caches.
- `headers()` rule: `/sw.js` gets `Cache-Control: no-cache, no-store, must-revalidate`.
- Registration `{ scope: "/", updateViaCache: "none" }` once from the app shell, when supported.
  `proxy.ts`'s matcher already skips `/sw.js` (a path with a dot); unchanged.

## Stage 3: The *This device* row

**Files:** `app/(app)/users/me/_components/push-device-row.tsx`, `lib/push/*`, messages.

States, one at a time (rule 22): unsupported, iOS not installed, *Turn on*, *On* + *Turn off*,
blocked. Turn on runs only after the tap, with `requestPermission()` first.

## Stage 4: The email/push grid and rule 7

**Files:** `app/(app)/users/me/_components/my-notifications.tsx`, `notifications-card.tsx`,
`group-watch-card.tsx`, its page, messages.

## Stage 5: Sign-out cleanup and docs

**Files:** `lib/push/sign-out-cleanup.ts`, `components/topbar.tsx`,
`app/(auth)/needs-role/_components/needs-role-actions.tsx`, `CLAUDE.md`, this file.

## Copy

All new text is in `NotificationSettings` (the card) and, if needed, `PushDevice`; both languages,
exactly as the boards draw them.
