# Unread dot: a light dot on the sidebar's Conversations item

Implementation spec for **Part 1c of report conversations** (sidebar **Conversations**, the nav item
itself; no route changes). Today the item shows the gold *Needs my reply* number, or nothing:

- when nothing waits for your reply but a thread has a comment you haven't opened, the item shows a
  small **light dot** instead, with no number;
- screen readers hear "Conversations, unread activity" while the dot shows.

**Decided** (cross-repo spec `../docs/specs/report-conversations.md`, rule 17, its *Changed Nov 5,
2026 (Part 1c)* paragraph, with rules 11 and 12):

- The dot shows only when `needsMyReply = 0` **and** `hasUnread` is true. When the gold number
  shows, the dot hides: one signal at a time. Neither: nothing.
- The dot is light (`heading-on-dark`), **never gold**, with no number, so it never reads as
  "waiting". The gold number keeps meaning "someone is waiting on us".
- `hasUnread` is the *Unread* tab's condition over every thread in the caller's view, no group
  filter (an `EXISTS`, not a count). *Mark all read* and opening a thread clear it; deleting the
  newest comment can clear it too (only live comments count as unread).
- Screen readers: "Conversations, unread activity" (es: "Conversaciones, actividad sin leer"); with
  the number, the existing "{count} waiting for your reply", unchanged.
- **The dashboard blocks don't change** (still *Needs my reply* only), nor the inbox.
- One read for both: a failed `/report-conversations/counts` hides the number **and** the dot, as
  it hid the number before; the page never waits on it for anyone outside the audience.

**Depends on the API:** `membership-management/docs/UNREAD-DOT-API-HANDOFF.md`, **done** and on
`main` (PR #69, no migration). Nothing is stubbed.

Work through it **stage by stage**, one reviewable commit per stage, on the **`unread-dot`** branch.
Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light and
dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each stage,
write a short summary of what changed and anything that differs from the canvas in the progress
log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Shell components", board `Sidebar`, tweak `conversations` = `waiting` (gold number) /
  `unread` (the dot) / `none` (nothing). The options board
  ([Conversations unread indicator](https://claude.ai/artifact/NCHsM9hBDWrFvq6Gc1RD9q)), **option
  A** ("Dot, only unread" and "Dot, both").
- **Boards:** `Sidebar` (as admin, elder or leader, light or dark, en or es; the rail is navy in both
  themes).
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9);
  no new tokens or components.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API type and the layout's read | ✅ | `3e09938` |
| 2. The dot on the sidebar item | ✅ | `a558c88` |
| 3. Design review fixes | ✅ | (this commit; review only, no code fixes) |

**Status: done** (2026-11-05), on branch `unread-dot`, not merged yet.

### Decisions and deviations

- **API type:** no generator here; `ConversationCounts` in `api/conversations-api/client.ts` is
  hand-written to `ConversationBadgeSchema` (`{ needsMyReply, hasUnread }`).
- **Stage 1:** the layout turns the one counts read into a `ConversationsSignal` (`{ waiting,
  unread }`, exported from `components/sidebar.tsx`) and passes it through `AppShell` as
  `conversations`, replacing `conversationsWaiting`. Outside the audience or on any failure it's
  `{ 0, false }`. No visible change: the sidebar still reads only `waiting`.
- **Stage 2:** `LeafLink` takes `dot` beside `badge` and draws it only while `badge` is 0: an 8px
  `bg-heading-on-dark` circle, `aria-hidden`, `mr-[7px]` (so with the row's 12px padding its right
  edge sits 19px in, centred where the 22px pill sits), plus a `sr-only` span with
  `Conversations.unreadDotLabel`, as the board's `dotLabel`. The badge's markup is unchanged.
- **How stage 2 was looked at:** the dev data (admin) has 4 waiting and 9 unread, so the real state
  is the number with no dot (checked: "Conversations" + the badge's "4 waiting for your reply", no
  dot). The dot itself was looked at with a temporary, uncommitted override in the layout (`waiting
  0, unread true`), reverted before the commit: 8×8, `rgb(244, 246, 249)` (`heading-on-dark`),
  vertically centred, on the active row (navy-800) and at rest; accessible name "Conversations,
  unread activity" / "Conversaciones, actividad sin leer"; 1512 (window), 1024 and 390 in
  same-origin iframes as in `UNREAD-TAB.md`, the 390 off-canvas nav opened; light and dark; en and
  es (Spanish fits). The theme and language were put back after.
- **Collapsed sidebar:** the app has no collapsed (icon-only) rail: the sidebar is full width from
  `lg` and off-canvas below it (the mobile nav, checked at 390). Nothing to do there.
- **How it was tried by role (stage 3):** with Luis's OK, a scratch members database
  (`udot-staff-check`: migrated, API seed run) behind a second API on `:8002`, with
  `APPLICATIONS_MEMBERSHIP_API_URL` in `.env` pointed at it for the check and restored after; the
  scratch database was dropped. auth-server has no seed users, so three throwaway users were added
  to the **dev auth database** (`udot-elder@`, `udot-leader@`, `udot-user@example.test`, roles
  elder, smallGroupLeader, user; created verified, straight in the DB with better-auth's
  `hashPassword`, so no verification email was sent). They're still there. In the scratch DB only,
  the elder was linked to member 33, the leader to member 49 (leader of group 2), the admin to
  member 9 (to comment). Elder, leader and outsider were signed in with curl against auth-server,
  and the sidebar read from the server-rendered `/members` HTML; admin was the real session in
  Chrome.
  - **Number, no dot:** elder 4 / leader 1 at the start (both also unread); later leader 3 waiting
    with unread threads: number only, "N waiting for your reply".
  - **Dot only:** leader after replying to their one waiting thread (two threads a co-leader had
    answered still unread): dot, "Conversations, unread activity" / "Conversaciones, actividad sin
    leer". Elder after replying to their 5 waiting threads: dot. Admin, then 0 waiting and 10
    unread: dot, in Chrome.
  - **Nothing:** leader after *Mark all read* (2 marked), elder after *Mark all read* (5 marked).
  - **After *Mark all as read*** in the UI (admin, 10 marked): the dot went away with the toast,
    no reload (the action's revalidation re-renders the layout).
  - **After the newest comment is deleted:** admin commented on a thread whose last word was
    already the elders' (elder: 0 waiting, dot), then deleted it (inline confirm): the elder's dot
    went away, nothing waiting.
  - **Outside the audience** (`user`): no Conversations item, no counts read (the layout skips it).
  - **Dashboard blocks:** unchanged code; the leader's lists the 3 waiting threads, the elder's
    none while they had only unread ones.

## Token changes

None. The dot is `bg-heading-on-dark` (`--color-heading-on-dark` in `styles/brand.css`, already a
utility through `@theme`): a raw brand color, which is right on the rail, the same navy in both
themes (as the badge's `bg-gold-500`).

New Tailwind utilities needed: none.

## The API

No generator in this repo: the counts type in `api/conversations-api/client.ts` is hand-written.

| Route | Change |
| --- | --- |
| `GET /report-conversations/counts` | `{ needsMyReply: int, hasUnread: bool }` (`ConversationBadgeSchema`, was `NeedsMyReplyCountSchema`). `hasUnread` is `false`, never 403, outside the audience. `smallGroupId` is ignored |

Permissions: none new. The layout keeps reading the counts only for `canSeeConversationsInbox`,
the same check as the nav item.

## Stage 1: API type and the layout's read

**Files:** `api/conversations-api/client.ts`, `app/(app)/layout.tsx`, `components/app-shell.tsx`,
`components/sidebar.tsx` (prop only).

- `getConversationCounts(): Promise<{ needsMyReply: number; hasUnread: boolean }>`.
- The layout reads both from one call into a `ConversationsSignal` (`{ waiting: number; unread:
  boolean }`): outside the audience, or on any failure, `{ waiting: 0, unread: false }`. It goes
  through `AppShell` to `Sidebar` in place of `conversationsWaiting`.
- No visible change yet: the sidebar still shows only the number.

## Stage 2: The dot on the sidebar item

**Files:** `components/sidebar.tsx`, messages.

- `LeafLink` takes the signal for the Conversations item. `waiting > 0`: the gold pill as today.
  Else, if `unread`: an 8px round dot, `bg-heading-on-dark`, `aria-hidden`, right-aligned with a
  7px right margin so it sits centred where the 22px pill would (as the board), plus a `sr-only`
  span with `Conversations.unreadDotLabel` (", unread activity") so the link's name reads
  "Conversations, unread activity". Else nothing.
- Same on the active row (navy-800) and at rest, and in the mobile nav (the same `Sidebar`,
  off-canvas below `lg`).
- After *Mark all as read*, opening a thread or a comment write, the layout re-reads the counts on
  the next render (the actions already revalidate the paths that show the badge), so the dot
  follows without a reload of its own.

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `Conversations.unreadDotLabel` | , unread activity | , actividad sin leer |

(The comma is part of the hidden text so the link's name reads as one phrase after the nav label,
as the board's `dotLabel`.)

## Not in this spec

- The dashboard blocks and the inbox (unchanged, rule 17).
- An unread count anywhere in the shell (option B, not chosen).
- Email (Part 2: `REPORT-CONVERSATIONS-EMAIL.md`).

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [x] `Sidebar` board, `conversations` = waiting / unread / none, matches at rest and active, in
      light and dark (the rail is the same; the page around it isn't).
- [x] 1440 / 1024 / 390 and the mobile nav: the dot and the number sit in the same place, nothing
      shifts the label.
- [x] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [x] The dot is never gold and never shows with the number.
- [x] Screen reader name: "Conversations, unread activity" / "Conversaciones, actividad sin leer";
      with the number, "{count} waiting for your reply".
- [x] Admin, elder, leader and someone outside the audience: number (no dot), unread only (dot),
      nothing, after *Mark all as read*, after the newest comment is deleted.
- [x] Dashboard blocks unchanged.
- [x] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [x] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
