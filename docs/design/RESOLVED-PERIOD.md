# Resolved period: a date filter on the Conversations inbox's Resolved tab

Implementation spec for **Part 1d of report conversations** (`/conversations`, the *Resolved* tab
only). Today the tab lists every resolved thread, 25 at a time with "Show more", so over months it
becomes a long list with no way to narrow it by time:

- a **Resolved in** select next to the group filter: *Last 30 days* (default), *Last 3 months*,
  *This year*, *All time*;
- a line above the rows with the filtered number ("12 resolved in the last 30 days");
- an empty state that names the period and offers *See all time*.

**Decided** (cross-repo spec `../docs/specs/report-conversations.md`, rule 15, its *Changed Nov 6,
2026 (Part 1d)* paragraph):

- The filter is on **when the thread was resolved** (`resolved_at`), not on its last comment or the
  report's meeting date.
- **The tab's count stays all time** (the four counts never take a filter, like the group filter
  today). The filtered number is the list's own line, from the response's `total`.
- In the URL as `?period=30d|3m|year|all`, like `?group=`. The default (`30d`) is left out; an
  unknown value is the default. Switching tab drops `period`; changing the group keeps it.
- This app turns the period into an instant: *Last 30 days* = now − 30 days; *Last 3 months* = now −
  3 calendar months; *This year* = 1 January 00:00 in `CHURCH_TIMEZONE`; *All time* = no filter.
  It's computed **once per page render** on the server and reused by "Show more", so pages never
  shift.
- Order unchanged: newest activity first.

**Status: done on the branch** (2026-11-06), stages 1–3 on `resolved-period`, not merged yet.

**Depends on the API:** `membership-management/docs/RESOLVED-PERIOD-API-HANDOFF.md`, **done** and on
`main` (PR #70, no migration). Nothing is stubbed.

Work through it **stage by stage**, one reviewable commit per stage, on the **`resolved-period`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each
stage, write a short summary of what changed and anything that differs from the canvas in the
progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Report conversations", the Conversations inbox boards. **No board shows this filter**: it
  reuses the group filter's select (label above, `h-10` trigger, same popover) and sits beside it;
  the count line uses the *Unread* tab's hint style. If a board is added later, it wins.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9);
  no new tokens or components.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Period, API param and the select | ✅ | `77de84c` |
| 2. Count line and empty state | ✅ | `ac64d77` |
| 3. Design review fixes | ✅ | (this commit; review only, no code fixes) |

### Decisions and deviations

- **API type:** no generator; `resolvedSince?: string` added by hand to `ConversationInboxParams`.
- **Stage 1:** `lib/resolved-period.ts` uses `@internationalized/date`'s `fromDate(at, timeZone)`, so
  the instant comes out as `toAbsoluteString()` (`…T18:30:00.000Z`, milliseconds included; the API's
  `AwareDatetime` takes it). `node --test lib/resolved-period.test.ts`: 5 tests pass (default and
  unknown period, 30 days, 3 calendar months incl. May 31 → Feb 28, *This year* at Managua
  midnight incl. the UTC-already-next-year evening, *All time* `null`). The page computes the
  instant only for `tab=resolved` and passes `period` / `resolvedSince` to the browser; the list's
  key now includes the period. The select is the group select's markup, `md:w-[200px]`, placed
  before the group select. Looked at with the dev data as admin (1512 wide, light, en): *Resolved*
  badge 3 (all time), *Last 30 days* lists 2; *All time* lists 3 and sets `?period=all`; switching
  to *Open* drops `period` and hides the select.
- **Stage 2:** the count line is the first child of the list (`text-[13.5px] text-muted`, the
  *Unread* hint's type), only on *Resolved* with rows; the copy is ICU `plural` in both languages
  (English reads the same for one and many, Spanish needs *resuelta* / *resueltas*). The empty state
  stays the plain `<p>` of the other non-reply tabs, with the *See all time* link in the
  *Unread* empty state's link style. Looked at: *Last 30 days* "2 resolved in the last 30 days";
  group `GP - #2` (nothing resolved) "Nothing resolved in the last 30 days. See all time", the
  link going to `?tab=resolved&period=all&group=2`, which shows the existing "No conversations here
  yet."
- **Stage 3 (review):** as admin on the dev data, in Chrome. Dark at 1512: the select, its popover
  (checked item), the count line and rows read correctly. Spanish, dark and light: *Resueltas en*,
  *Últimos 30 días*, "2 resueltas en los últimos 30 días", "Nada resuelto en los últimos 30 días.
  Ver todas"; nothing truncates. 1024 and 390 in same-origin iframes (the window wouldn't resize):
  at 1024 the two selects wrap under the tabs side by side (200 / 300 px); at 390 they stack full
  width, period first; the tab strip scrolls sideways at 390 as it already did. No code fixes.
  The theme and language were put back after (English is now an explicit choice in the account
  menu rather than the browser default). **Not looked at as a leader** in the UI: the page has no
  leader-specific branch for this filter, and the API side was tried per role
  (`membership-management/docs/RESOLVED-PERIOD-API-HANDOFF.md`).

## Token changes

None. New Tailwind utilities needed: none.

## The API

No generator in this repo: `ConversationInboxParams` in `api/conversations-api/types.ts` is
hand-written.

| Route | Change |
| --- | --- |
| `GET /report-conversations` | optional `resolvedSince` (ISO 8601 instant with an offset), **only with `tab=resolved`** (422 otherwise). Filters `items` and `total`, never `counts`. Response shape unchanged |

Permissions: none new; the page keeps `canSeeConversationsInbox`.

## Stage 1: Period, API param and the select

**Files:** `lib/resolved-period.ts` (+ `lib/resolved-period.test.ts`), `api/conversations-api/types.ts`,
`app/(app)/conversations/page.tsx`, `app/(app)/conversations/_components/conversations-browser.tsx`,
messages.

- `lib/resolved-period.ts` (pure, no `server-only`, so `node --test` can run it): `RESOLVED_PERIODS`,
  `parseResolvedPeriod(value)` (unknown → `30d`), and `resolvedSinceFor(period, timeZone, at)` →
  the ISO instant (`Z`) or `null` for `all`, with `@internationalized/date` (already a dependency)
  so *This year* is midnight in the church's zone and month arithmetic is calendar-correct.
- `ConversationInboxParams.resolvedSince?: string`.
- The page reads `?period=` only when `tab=resolved`, computes `resolvedSince` once, sends it on the
  first page, and passes `period` and `resolvedSince` to the browser.
- The browser shows the *Resolved in* select only on the *Resolved* tab, before the group select;
  picking the default removes `period` from the URL. A tab change drops `period`. "Show more" sends
  the same `resolvedSince`. The list's key includes the period, so a change starts it over.

## Stage 2: Count line and empty state

**Files:** `conversations-browser.tsx`, messages.

- Above the rows on the *Resolved* tab, when there are rows: "{count} resolved in the last 30 days" /
  "…in the last 3 months" / "…this year", "{count} resolved" for *All time*, from `total`, in the
  *Unread* hint's style.
- Empty, period other than *All time*: "Nothing resolved in the last 30 days." (or the period's
  phrase) and a *See all time* link (`?tab=resolved&period=all`, group kept). Empty on *All time*:
  the existing `emptyOther`.

## Stage 3: Design review

Light and dark, 1440 / 1024 / 390 (the two selects stack below `sm`), English and Spanish, as admin
and as a leader; a long Spanish label fits the trigger.

## Copy

| Key (`Conversations`) | en | es |
| --- | --- | --- |
| `period` | Resolved in | Resueltas en |
| `period30d` | Last 30 days | Últimos 30 días |
| `period3m` | Last 3 months | Últimos 3 meses |
| `periodYear` | This year | Este año |
| `periodAll` | All time | Todo el tiempo |
| `resolvedCount30d` | {count} resolved in the last 30 days | {count} resueltas en los últimos 30 días (plural: 1 resuelta) |
| `resolvedCount3m` | {count} resolved in the last 3 months | {count} resueltas en los últimos 3 meses |
| `resolvedCountYear` | {count} resolved this year | {count} resueltas este año |
| `resolvedCountAll` | {count} resolved | {count} resueltas |
| `emptyResolved30d` | Nothing resolved in the last 30 days. | Nada resuelto en los últimos 30 días. |
| `emptyResolved3m` | Nothing resolved in the last 3 months. | Nada resuelto en los últimos 3 meses. |
| `emptyResolvedYear` | Nothing resolved this year. | Nada resuelto este año. |
| `seeAllTime` | See all time | Ver todas |

## Not in this spec

- Changing the tab counts, the order, or the other tabs.
- A custom date range.
- Email (Part 2).
