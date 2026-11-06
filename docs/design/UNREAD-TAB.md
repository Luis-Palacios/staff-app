# Unread tab: *Unread* and *Mark all as read* on Conversations

Implementation spec for **Part 1b of report conversations** (sidebar **Conversations**,
`/conversations`), which today has three tabs (*Needs my reply*, *Open*, *Resolved*):

- a fourth tab, **Unread**, second in the row, listing the threads with a comment by someone else
  that you haven't opened, any status, with its own (neutral) count;
- a short hint under the toolbar on that tab, saying why a thread can be here and not in *Needs my
  reply*;
- **Mark all as read** on that tab (with the group filter, when one is set), and a toast saying how
  many were marked;
- an *Unread* empty state ("Nothing unread").

**Decided** (cross-repo spec `../docs/specs/report-conversations.md`, rule 17, with rules 11 and
12):

- *Unread* = a comment by someone else newer than your read mark, open **or** resolved. It's how you
  see activity that someone on your side already answered (*Needs my reply* is per side).
- Only *Needs my reply* is gold. The *Unread* count is neutral, and **the sidebar badge and the
  dashboard blocks don't change**: they stay *Needs my reply* only (`/report-conversations/counts`
  and `tab=reply`), so the badge keeps meaning "someone is waiting on us".
- *Mark all as read* marks every thread in your view and the group filter read up to its latest
  activity (not `now()`), so a comment that lands while you click stays unread. No confirmation
  dialog: the canvas shows a toast only, and marking read loses nothing (every thread is still in
  *Open* or *Resolved*).
- Counts ignore the group filter, as the other tabs' counts do.

**Depends on the API:** `membership-management/docs/UNREAD-TAB-API-HANDOFF.md`, **done** and on
`main` (migration `096025ed70a6`). Nothing is stubbed.

Work through it **stage by stage**, one reviewable commit per stage, on the **`unread-tab`** branch.
Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light and
dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each stage,
write a short summary of what changed and anything that differs from the canvas in the progress
log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Report conversations", row "Unread tab and Mark all as read (Part 1b)", and the rules note
  ("Unread (Part 1b, rule 17)" and "Inbox" paragraphs).
- **Boards:** `Conversations-Unread` (elder, Unread tab with rows, 1440),
  `Conversations-Unread-Marked` (after *Mark all as read*: empty state and toast),
  `Conversations-Unread-Phone` (390), `Conversations-Unread-Dark-ES` (leader, dark, Spanish). All
  four are the `Conversations` component with `filter="unread"`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9);
  no new tokens or components.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API types, client and server action | ⬜ | |
| 2. The *Unread* tab, its hint and empty state | ⬜ | |
| 3. *Mark all as read* and its toast | ⬜ | |
| 4. Design review fixes | ⬜ | |

### Decisions and deviations

- (filled in per stage)

## Token changes

None. The tab uses `StatusTabs` (neutral count unless `highlighted`), the button `Button
variant="outline"`, the toast `showToast` (`ToastHost` in the shell), the empty state `EmptyState`,
and unread rows keep `ConversationRow`'s existing treatment (gold dot, bold name, `bg-focus-row`).

New Tailwind utilities needed: none.

## The API

Checked against the running local API's `/openapi.json` (no generator: `api/conversations-api/types.ts`
is hand-written and kept to the OpenAPI shapes).

| Route | Change |
| --- | --- |
| `GET /report-conversations?tab=reply\|unread\|open\|resolved&smallGroupId=&limit=&offset=` | `tab` gains `unread`; `counts` (`InboxCountsSchema`) gains `unread: int`. Rows unchanged (`unread: true` on every *Unread* row) |
| `POST /report-conversations/read-all?smallGroupId=` | New. `200 { marked: int }` (`MarkAllReadSchema`): the threads that were unread and no longer are. A group outside the caller's view gives `{ marked: 0 }`; `user` gets 403. Rate limit 30/minute |
| `GET /report-conversations/counts` | **Unchanged** (`{ needsMyReply }`, the badge) |

Permissions: no new one (rule 4). The page keeps `canSeeConversationsInbox`; the server action
checks `smallGroupReports: view` like the other conversation actions, then calls the API, which
applies the scope. Errors: any failure shows `Conversations.markAllError` in a danger toast; the
API's text is never shown.

## Stage 1: API types, client and server action

**Files:** `api/conversations-api/types.ts`, `api/conversations-api/client.ts`,
`app/(app)/groups/reports/_actions/conversation-actions.ts`.

- `ConversationInboxTab` gains `"unread"`; `ConversationInbox.counts` gains `unread`.
- `markAllConversationsRead(smallGroupId?: number): Promise<{ marked: number }>` (`POST`).
- `markAllConversationsReadAction(smallGroupId: number | null)` → `{ ok: true; marked } | { ok:
  false; message }`. On success it revalidates the inbox, the dashboards (their rows carry the
  unread dot) and the report pages (row indicators), the same paths a comment write revalidates
  plus every report page.

## Stage 2: The *Unread* tab, its hint and empty state (`/conversations?tab=unread`)

**Files:** `app/(app)/conversations/page.tsx`, `_components/conversations-browser.tsx`, messages.

- Tabs, in this order: *Needs my reply* · *Unread* · *Open* · *Resolved*. `?tab=unread` in the URL,
  like the others (*Needs my reply* stays the default with no param). Only `reply` is
  `highlighted`.
- With rows: a muted hint under the toolbar (13.5px, `text-muted`, max ~680px), elder or leader
  wording. Rows are the existing `ConversationRow`; on this tab every row has the unread treatment.
- Empty: `EmptyState` with the check icon, "Nothing unread" and its body, and the existing *See open
  conversations* link (as the board). No hint when empty.
- With four tabs the toolbar no longer fits on one row at 1024 (sidebar open): it wraps, tabs first,
  then the group filter (and, stage 3, the button). The tab track still scrolls sideways inside
  itself at 390, never the page.

## Stage 3: *Mark all as read* and its toast

**Files:** `_components/conversations-browser.tsx`, messages.

- `Button variant="outline"` with a double-check icon, next to the group filter, shown only on the
  *Unread* tab while it has rows. Full width below the filter at phone width.
- Press: pending state on the button; calls the action with the current group filter. Success: a
  toast "N conversations marked as read" (`=0`: "Everything was already read"), and the page
  re-renders from the server (the action revalidates), so the list empties, the *Unread* count drops
  and the button hides. Focus then goes to the list region so it isn't lost on the removed button.
  Failure: a danger toast, nothing changes.
- The list keeps its own rows for "Show more", so it resets to the server's first page whenever the
  page data changes (not only when the tab or group key changes).

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `Conversations.tabUnread` | Unread | Sin leer |
| `Conversations.unreadHintElder` | Conversations with comments you haven’t opened yet, including ones another elder already answered. | Conversaciones con comentarios que aún no abres, incluidas las que otro anciano ya respondió. |
| `Conversations.unreadHintLeader` | Conversations with comments you haven’t opened yet, including ones a co-leader already answered. | Conversaciones con comentarios que aún no abres, incluidas las que un colíder ya respondió. |
| `Conversations.emptyUnreadTitle` | Nothing unread | Nada sin leer |
| `Conversations.emptyUnread` | You’ve seen every comment. When someone else comments in a conversation, it shows up here until you open it. | Ya viste todos los comentarios. Cuando alguien más comente en una conversación, aparecerá aquí hasta que la abras. |
| `Conversations.markAll` | Mark all as read | Marcar todo como leído |
| `Conversations.markedToast` | {count, plural, =0 {Everything was already read} one {# conversation marked as read} other {# conversations marked as read}} | {count, plural, =0 {Ya estaba todo leído} one {# conversación marcada como leída} other {# conversaciones marcadas como leídas}} |
| `Conversations.markAllError` | Couldn’t mark them as read. Try again. | No se pudieron marcar como leídas. Inténtalo de nuevo. |

(*colíder*, as the existing `roleCoLeader`, where the board writes *co-líder*.)

## Not in this spec

- The sidebar badge and the dashboard blocks (rule 17 keeps them *Needs my reply* only).
- Ordering by `last_activity_at` (the inbox stays newest comment first).
- Email, watching groups (Part 2: `REPORT-CONVERSATIONS-EMAIL.md`).

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; only *Needs my reply*'s count is gold.
- [ ] Focus ring visible on every control; focus after *Mark all as read* lands on the list.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] Sidebar badge and dashboard blocks unchanged.
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
