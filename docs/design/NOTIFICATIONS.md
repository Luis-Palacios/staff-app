# Notifications, Part 1: the bell, the popover and `/notifications` (staff-app)

Implementation spec for the staff-app side of **in-app notifications** (the top bar's bell, a
popover from it, the `/notifications` page and the app icon badge). Cross-repo spec:
`../docs/specs/notifications.md`, **Part 1 only** (rules 7, 11, 12, 13, 15, 17, 18, the Part 1 rows of
*Copy*, and *Contracts (Part 1) → staff-app*). Nothing from Part 2: no service worker, no push, no
*This device* row, no email/push grid.

- **The bell** sits in the top bar between the search and the account menu, for every signed-in user
  while in-app notifications are on at the server (`unread-count.enabled`). A gold count of unread
  entries (1–99, then "99+"), nothing at 0. From 1024 px a click opens a popover (latest 10, *Mark
  all read*, *See all*, empty state); below 1024 px it links to `/notifications`. Opening the popover
  marks nothing read.
- **`/notifications`:** newest first, grouped by Today, Yesterday and then the date (church time
  zone); unread entries marked; *Show more* (cursor paging), *Mark all read* and an empty state.
- **One opening path:** every entry links to `/notifications/open/{id}`, a route handler that marks
  the entry read and redirects to its `path`.
- **The app icon badge** (Badging API) follows the unread count wherever the page loads it.
- **Watching switches** stay enabled while in-app is on (rule 7).

**Decided** (cross-repo spec, don't reopen): *Rules* 7, 11–15, 17, 18; the copy tables. The Conversations
badge in the sidebar stays (rule 18). The entry text is rendered from `template` + `data` here, never
sent as text by the API (the API sends exactly the email's `data`).

**Depends on the API:** `membership-management/docs/NOTIFICATIONS-API-HANDOFF.md`, **done** and on
`main` (PR #77). Nothing is stubbed. Branch `feature/notifications` (same name in every repo of the spec).

Work through it **stage by stage**, one reviewable commit per stage, on the **`feature/notifications`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light and
dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each stage,
write a short summary of what changed and anything that differs from the canvas in the progress log
below. A stage's hash is filled in by the next stage's commit (a commit can't contain its own hash).

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Notifications", mirrored in `design-canvas/project/`.
- **Boards:** `Bell-States` (bell in the top bar: none, count, 99+, open, dark, es, at 1440/1024 and
  390), `Bell-Popover` (popover items, empty, dark, es), `Notifications` / `Notifications-Empty` /
  `Notifications-Leader-Tablet` / `Notifications-Phone` / `Notifications-Phone-Dark-ES`; components
  `NotificationBell`, `TopbarPhone`, `NotificationsPopover`; the shared `Topbar` board's `bell` tweak.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 0. This handoff | ✅ | (the commit that adds this file) |
| 1. API client, types, entry view model and messages | ⬜ | |
| 2. Bell, count, refresh and app badge | ⬜ | |
| 3. The popover | ⬜ | |
| 4. `/notifications` page and `/notifications/open/[id]` | ⬜ | |
| 5. Watching switches (rule 7) and docs | ⬜ | |

### Decisions and deviations

- (filled in per stage)

## Token changes

None expected: the boards use the existing tokens (`accent-soft`, `success-soft`, `warning-soft`,
`separator`, `focus-row`, `heading`, `muted`, `overlay-border`, `shadow-overlay-menu`; the gold count
is the brand's `gold-500` / `navy-900`, as the sidebar's badge). One difference to confirm in the
design review: the board tints an unread row `#FFFCF4` (light) / `rgba(242,181,68,0.06)` (dark); the
build uses `bg-focus-row` (`#FBF6EA` / `rgb(242 181 68 / 0.08)`), the token the Conversations inbox
already uses for an unread row. A dedicated token would be needed for the exact board values.

New Tailwind utilities needed: none.

## The API

No generator in this repo: the types in `api/notifications-api/types.ts` are hand-written to
membership-management's OpenAPI schemas (`NotificationsPageSchema`, `NotificationSchema`,
`UnreadCountSchema`, `NotificationOpenedSchema`, `NotificationsMarkedSchema`). All JWT, camelCase.

| Route | Response | Notes |
| --- | --- | --- |
| `GET /me/notifications?limit=20&before={id}` | `{ items: [{ id, category, template, data, path, createdAt, readAt }], nextBefore }` | `limit` 1–50, `before` ≥ 1, newest first. 404 `notifications_disabled` while the flag is off |
| `GET /me/notifications/unread-count` | `{ enabled, unread }` | Never 404. `{ enabled: false, unread: 0 }` while off: the bell is hidden |
| `POST /me/notifications/{id}/read` | `{ path }` | Idempotent. 404 (no code) when not the caller's or gone: the open route redirects to `/notifications` |
| `POST /me/notifications/read-all` | `{ marked }` | |

Rate limits: 120/min on `{id}/read`, 30/min on `read-all`, 300/min default (the count read is
throttled in the client: see Stage 2). `data` is exactly the email delivery's data for the template:

| Template | `data` keys used here |
| --- | --- |
| `report-conversation.new` / `.reply` | `actorName`, `groupName`, `meetingDate` (YYYY-MM-DD), `topic` (`person` \| `prayer` \| `praise` \| `followUp`); `startedBy` and `reason` are not shown |
| `report.submitted` | `submitterName`, `groupName`, `meetingDate`, `held`, `attendedCount` and `peopleCount` (held only); `reason` not shown |
| `report.reminder` | `weekStart` (YYYY-MM-DD), `groups: [{ name, hasDraft }]` (1–50); `recipientName` not shown |

Marking an entry read does **not** reset the conversation email throttle: only the thread panel's
`POST /report-conversations/{id}/read` does (and it also marks that thread's entries read, rule 13).
The panel already calls it when it opens (`conversation-panel.tsx` → `markConversationReadAction`),
so the open route only marks the entry and redirects.

Permissions: none new. Everyone signed in (with a role) gets the bell; the API scopes entries to the caller.

## Stage 1: API client, types, entry view model and messages

**Files:** `api/notifications-api/types.ts`, `api/notifications-api/client.ts`,
`lib/notifications/entry.ts` (server-only view model), `lib/format-date.ts`, `messages/en.json`,
`messages/es.json`, `i18n/client-namespaces.ts`.

- The four routes as `listNotifications`, `getUnreadCount` (cached per render), `markNotificationRead`
  and `markAllNotificationsRead`, with the types above.
- `toNotificationViews(items, locale)` turns the API's entries into what the UI draws (title,
  secondary line, kind, day group, time) with next-intl in the `Notifications` namespace, in the
  church time zone. An unknown template, or a `data` that doesn't have what the copy needs, is
  skipped, never thrown on. Because the church time zone is server-only, grouping and times are made
  on the server and reach the client as plain text; "Show more" and the popover ask for views through
  server actions.
- Which copy a template uses: `report-conversation.new` + `topic: person` → *started a conversation
  about someone*; `+ topic` a section → *commented on the {section}*; `.reply` → *replied in a
  conversation*; `report.submitted` with `held` → *{group} submitted its report*, else *{group} didn't
  meet* (kind icon: calendar); `report.reminder` with one group → *Time to submit the {group} report*
  or, when `hasDraft`, *Your {group} report is still a draft*; with several → *Time to submit {count}
  small group reports*.

## Stage 2: Bell, count, refresh and app badge

**Files:** `components/topbar.tsx`, `components/app-shell.tsx`, `app/(app)/layout.tsx`,
`components/notifications/notification-bell.tsx`, `lib/notifications/use-unread-count.ts`,
`app/(app)/_actions/in-app-notification-actions.ts`.

- The layout reads `getUnreadCount()` server-side next to the conversation counts (a failure counts as
  `{ enabled: false, unread: 0 }`: the bell is hidden rather than the app broken) and passes it down
  through `AppShell` to `Topbar`.
- `NotificationBell`: 44×44 button with a 22px bell and the gold count at top-right with a ring in the
  bar colour. Below `lg` a link to `/notifications`, from `lg` the button (both are always in the
  markup and CSS shows one, so there is no flash). Screen readers hear "Notifications, {count}
  unread" or "Notifications" (the count is the shown text, so "99+").
- **Refresh (rule 11):** the layout is not re-rendered by soft navigation, so the count refreshes
  from the client: a server action reads `unread-count` when the path changes, when the window gets
  focus or the tab becomes visible again, and after *Mark all read* (a window event). Reads are
  throttled (not twice within 2 s). The server's number is the starting value and wins when the
  layout renders again.
- **App badge (rule 17):** wherever the count is loaded (first render, every refresh) the client calls
  `navigator.setAppBadge(count)` or `clearAppBadge()` at 0, when they exist; errors are swallowed.

## Stage 3: The popover

**Files:** `components/notifications/notification-popover.tsx`,
`components/notifications/notification-row.tsx`, `components/icons.tsx` (the double check, moved from
the Conversations inbox).

- HeroUI `Popover`, 400px wide, anchored under the bell, closing on Esc, outside click and any link
  inside. Opening it loads the latest 10 through a server action (skeleton while loading, an error
  with *Try again*); it marks nothing read. Header: "Notifications" and *Mark all read* (while the
  count is above 0). Footer: *See all*. Empty: "You're all caught up".
- Each row is a link to `/notifications/open/{id}` with `prefetch={false}`.

## Stage 4: `/notifications` and the open route

**Files:** `app/(app)/notifications/page.tsx`, `app/(app)/notifications/_components/*`,
`app/(app)/notifications/open/[id]/route.ts`.

- Page: `StaffAppPageHeader` (title, subtitle), the unread line and *Mark all read*, day sections of
  rows in a card, *Show more*, empty state, error state. A 404 when in-app is off at the server.
- Open route: reads the entry's `path` from `POST /me/notifications/{id}/read`, accepts only a
  same-origin relative path (`safeReturnPath`: starts with a single `/`), and redirects to it.
  Anything else (a bad id, a 404, a failure, an unsafe path) redirects to `/notifications`. A request
  with no session goes through the usual sign-in redirect and comes back.

## Stage 5: Watching switches (rule 7) and docs

**Files:** `app/(app)/groups/[id]/page.tsx`, `app/(app)/groups/[id]/_components/group-watch-card.tsx`,
`app/(app)/users/me/_components/my-notifications.tsx`, `notifications-card.tsx`, `CLAUDE.md`.

- `/me/notification-preferences` has no in-app flag, so the pages read `unread-count.enabled`. While
  it is true the Watching switches are never disabled and the hints don't tell people to turn emails
  on. With it off, today's rule applies. Unwatching affects future entries only.
- `CLAUDE.md` mentions the bell and the open route.

## Copy

Namespace `Notifications` (a client namespace: the bell, popover and list are client components).
The list entries use the spec's *Copy* tables; `{date}` is `formatCalendarRowDate` ("Thu, Nov 19" /
"jue 19 nov", as the boards), `{weekStart}` is `formatCalendarShortDate` ("Nov 15" / "15 nov").

| Key | English | Español |
| --- | --- | --- |
| `bell` | Notifications | Notificaciones |
| `bellUnread` | Notifications, {count} unread | Notificaciones, {count} sin leer |
| `title` | Notifications | Notificaciones |
| `subtitle` | Activity on reports and conversations that concerns you. Kept for 90 days. | Actividad en reportes y conversaciones que te concierne. Se guardan 90 días. |
| `unreadLine` | {count} unread | {count} sin leer |
| `markAll` | Mark all read | Marcar todo como leído |
| `seeAll` | See all | Ver todas |
| `showMore` | Show more | Ver más |
| `today` / `yesterday` | Today / Yesterday | Hoy / Ayer |
| `emptyTitle` | You’re all caught up | Estás al día |
| `emptyBody` | New activity on reports and conversations will show here. | La actividad nueva en reportes y conversaciones aparecerá aquí. |
| `loadFailed`, `retry`, `markAllFailed` | (UI states, see messages) | |
| `kind*`, `unreadSuffix` | Screen-reader prefix per kind, ", unread" | |
| `conversation*`, `submitted*`, `reminder*`, `section*` | The entry copy of the spec's table | |

## Not in this spec

- Part 2: the service worker, push, the *This device* row, the email/push grid, sign-out cleanup, and
  the badge from the service worker (`PUSH-NOTIFICATIONS.md`, later).
- An *Unread* filter, a device list, a gentle prompt (the spec's *Later*).
- Real-time updates: the count refreshes on navigation, focus and your own actions only.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; the church label keeps about 110px
      at 390.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; the unread mark is a dot plus bolder text, not color alone.
- [ ] Focus ring visible on every control; the popover returns focus to the bell.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass; `pnpm build` passes.
