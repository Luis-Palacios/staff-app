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
| 4. The email/push grid and rule 7 | ✅ | |
| 5. Sign-out cleanup and docs | ⬜ | |

### Decisions and deviations

(Filled in as the stages land.)

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
