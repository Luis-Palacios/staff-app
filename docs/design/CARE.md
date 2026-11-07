# Care and the care log: logging care, the Care page, a care's page

Implementation spec for **the care log** (Part 1) and **care** (*acompañamiento*, Part 2), which
don't exist today:

- **Part 1, the care log:** a *Log care* form (a call, messages, a meeting, a visit, something
  someone told us, a note; done or planned) opened from the person's Timeline tab, a report row,
  the conversation panel and Prayer & follow-up; care log entries on the person timeline with a
  *Care* chip and a *Coming up* heading; *Record how it went* for plans whose date passed; and a
  *Coming up* block on both dashboards.
- **Part 2, care:** a **Care** page (`/care`, sidebar *Care* / *Acompañamientos* with a badge) with
  *Needs attention · Open · Unread · For prayer · Closed*; a care's page (`/care/[id]`) with its
  stream, owners, next check-in, *Add update*, *Take it*, *Close* and *Reopen*; the *Start care*
  and *Edit care* form; *Add to care*; the care menu on report rows, items, the conversation panel
  and Prayer & follow-up; *Care needing attention* on the dashboards; *Care started* and "In care"
  on the timeline.

**Decided** (cross-repo spec `../docs/specs/care.md`, rules 1–40; don't reopen):

- Words: **Care** (EN) / **Acompañamiento** (ES) for a care; **Care log entry** / **Registro de
  cuidado** for one event; **Owner** / **Responsable**. The UI never says "case" or "caso", and
  Spanish labels avoid *pastoral* (leaders log care too).
- Who sees a care log entry: *Elders and {name}'s leaders* (default) or *Elders only*; inside a
  care it follows the care (rules 8–9). Who can open a care: *Elders and owners*, *Elders, owners
  and their leaders*, or *All leaders*, chosen when starting it, **with nothing pre-selected**
  (rules 15, 17). What you can't open never shows, not even a hint (rule 19).
- Admins are treated exactly as elders (rule 20). The person never sees any of it.
- Only owners and elders move the next check-in, and only together with an update (rule 23).
- The **care icon is the filled open-hands shape** (`CareIcon`, stage 1), never the heart: the heart
  stays prayer's.

**Depends on the API:** `membership-management/docs/CARE-API-HANDOFF.md` (Part 1 stages 1–4 for
stages 1–5 here; Part 2 stages 6–11 for stages 7–12 here) and `auth-server/docs/CARE-HANDOFF.md`
(the `careLog` and `care` permissions). If a stage starts before its endpoints are on `main`, say so
and stop; stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage: Part 1 on the **`care-log`**
branch (stages 1–6), Part 2 on the **`care`** branch (stages 7–13), started from `main` after Part 1
merges. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each
stage, write a short summary of what changed and anything that differs from the canvas in the
progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Care"**. Each row has a blue rules note that matches the cross-repo spec.
- **Boards, Part 1:**
  - *Logging care*: `CareLogForm` (component), `CareLog-Call`, `CareLog-Planned` (from a
    conversation), `CareLog-Heard` (*Elders only*, someone not in the system), `CareLog-Complete`
    (*Record how it went*), `CareLog-Leader-Message`, `CareLog-Phone-Dark-ES`.
  - *On the person timeline*: `MemberDetail-Timeline-Care`, `MemberDetail-Activity-Care`,
    `PersonTimeline-Care`, `PersonTimeline-Care-Leader`, `PersonTimeline-Care-Filter`,
    `PersonTimeline-Care-Guest`, `PersonTimeline-Care-Phone-Dark-ES`.
  - *Coming up*: `LeaderDashboard-Elder-Care`, `LeaderDashboard-Care`,
    `LeaderDashboard-Care-Phone-Dark-ES`.
- **Boards, Part 2:**
  - *The Care page*: `CareList` (elder, Needs attention), `CareList-Open`, `CareList-Leader`,
    `CareList-Prayer-Leader`, `CareList-Empty`, `CareList-Phone-Dark-ES`, `Sidebar-Care`.
  - *A care's page*: `CareDetail` (urgent, overdue, elder owner), `CareDetail-Update`,
    `CareDetail-Lucia-Leader` (leader owner, due today), `CareDetail-NeedsOwner`,
    `CareDetail-Close`, `CareDetail-Closed`, `CareDetail-Phone-Dark-ES`.
  - *Starting care*: `StartCareForm` (component), `StartCare-Blank`, `StartCare-FromFollowUp`,
    `StartCare-Leader-NoOwner`, `StartCare-Leader-Private`, `StartCare-FromCareLog`,
    `StartCare-Edit`, `StartCare-Phone-Dark-ES`, `AddToCareDialog` (component), `AddToCare`,
    `AddToCare-Entry`, `CareMenu`.
  - *Dashboards and timeline*: `LeaderDashboard-Elder-CareFull`, `LeaderDashboard-CareFull`,
    `MemberDetail-Timeline-CareFull`, `PersonTimeline-CareFull-Leader`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).
  No new tokens expected (see *Token changes*).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| **Part 1, branch `care-log`** | | |
| 1. Permissions, `CareIcon`, API types, client and server actions (care log) | ⬜ | |
| 2. The care log form | ⬜ | |
| 3. Care log entries on the timeline | ⬜ | |
| 4. *Log care* from reports, the conversation panel and Prayer & follow-up | ⬜ | |
| 5. *Coming up* on the dashboards | ⬜ | |
| 6. Design review fixes (Part 1) | ⬜ | |
| **Part 2, branch `care`** | | |
| 7. API types, client and server actions (care) | ⬜ | |
| 8. The Care page and the sidebar item | ⬜ | |
| 9. A care's page | ⬜ | |
| 10. *Start care*, *Edit care*, *Add to care* and the care menu | ⬜ | |
| 11. *Care needing attention*, *Care started*, "In care", linked-care chips | ⬜ | |
| 12. Design review fixes (Part 2) | ⬜ | |

### Decisions and deviations

- (none yet)

## Token changes

None expected. Map the boards' colors to existing tokens:

| Board color | Use |
| --- | --- |
| Overdue / *Urgent* (red tint) | `danger-soft` / `danger-soft-foreground` |
| Due today / *Needs an owner* / planned (amber tint) | `warning-soft` / `warning-soft-foreground` |
| Open status, person chips, entry tiles | the existing accent soft tint used by tag chips |
| Closed status | `success-soft` / `success-soft-foreground` |
| Prayer summary card (warm paper tint) | an existing soft surface; if none reads right, raise it in review before adding a token |

New Tailwind utilities: none.

## The API

All hand-written types in `api/members-api/` (no generator), mirroring the API handoff's schemas.

**Part 1** (`careLog` permission): `GET /care-log/people-search?q=`, `POST /care-log`,
`GET|PATCH|DELETE /care-log/{id}`, `POST /care-log/{id}/complete`, `POST /care-log/{id}/cancel`,
`GET /care-log/coming-up`; timeline entries of kind `careLog` and `counts.careLog`.

**Part 2** (`care` permission): `GET /care-cases` (`tab`, `mine`, `urgent`, `groupId`, `page`),
`GET /care-cases/counts`, `GET /care-cases/prayer-summaries`, `POST /care-cases`,
`GET|PATCH /care-cases/{id}`, `POST /care-cases/{id}/status|take|owners|read|links`,
`DELETE /care-cases/{id}/owners/{memberId}` and `…/links/{linkId}`,
`GET /care-cases/{id}/move-preview`, `GET /care-cases/linked?reportIds=`,
`GET /care-cases/owner-options?q=`; timeline entries of kind `care`, `counts.care`, and
`careCase` on care log entries inside a care.

**Errors** (status + `code` → message key):

| Status · code | When | Key |
| --- | --- | --- |
| 409 `link` | no linked member | `CareLog.errors.link` |
| 422 `kind_status`, `date`, `text`, `people` | form validation | `CareLog.errors.*` |
| 403 `author` | edit, delete, complete or cancel someone else's entry | `CareLog.errors.author` |
| 422 `visibility` | *Start care* without choosing who can see it | `Care.errors.visibility` |
| 422 `check_in` | check-in missing or in the past | `Care.errors.checkIn` |
| 422 `closing_note` | closing without a note | `Care.errors.closingNote` |
| 403 `owner` | an owner-only action by someone else | `Care.errors.owner` |
| 409 `has_owner` | *Take it* after someone else took it | `Care.errors.hasOwner` (then refresh) |
| 422 `owner` | adding an owner without `care: view` | `Care.errors.ownerPermission` |
| 404 | anything outside what you can open | the page's `notFound()` |

---

# Part 1 (branch `care-log`)

## Stage 1: permissions, `CareIcon`, API types, client and server actions

- `lib/auth/permissions.ts`: add `careLog: "all" | "view" | "create"` and (for stage 7)
  `care: "all" | "view" | "create" | "update"` to the unions.
- `CareIcon` in `components/icons.tsx`: the **filled** open-hands path from the `Sidebar` board's
  Care item (24×24 viewBox, `fill="currentColor"`, `fill-rule="evenodd"`, no stroke). Copy the path
  from the board; don't redraw it. It's filled while the other icons are outlined: that's
  intended.
- Types, client functions and server actions for the Part 1 routes. Server actions check
  `careLog: create` before calling the API, as every action does.

## Stage 2: the care log form

**Files:** `components/care/care-log-form.tsx` (dialog on `md` and up, bottom sheet below), its
server actions. Boards: `CareLogForm` and the `CareLog-*` variants.

- **What was it?** six choice buttons (Call, Messages, Meeting, Visit, Someone told us, Note), two
  columns on phones, three above. **Did it happen, or is it planned?** only for call, meeting and
  visit (a segmented control). **Where** (in person / online) only for meetings. **Who told us?**
  only for *Someone told us*.
- **Date** (and optional **Time** when planned). Done: never in the future. Planned: today or later.
- **About:** person chips with a remove button, *Add someone* (the `people-search` endpoint), and
  *+ Someone who isn't in the system* opening a short **Others involved** field.
- **Who else took part** (optional): member chips.
- **Text** label by state: *What happened?*, *What is it for?* (optional, planned), *What did they
  tell us?*, *Note*, *How did it go?* (complete). Hint: *Write only what's needed to care well.*
  Counter `n / 4000`.
- **From** card when opened from a source (rule 12).
- **Who can see it:** *Elders and {name}'s leaders* (default) or *Elders only* (lock icon), as radio
  cards with their descriptions.
- **Record how it went** (`variant=complete`): the plan's summary box, *When did it happen?*, *How
  did it go?* (required), a read-only "Seen by…" line, and *It didn't happen* (cancel) on the left
  of the footer.
- After saving: close, toast, refresh the page's data; focus returns to the button that opened it.
- Errors under the fields they belong to; `link` as a banner in the form.

## Stage 3: care log entries on the timeline

**Files:** `components/report-timeline/*` (the timeline card, month, row), the Timeline tab pages for
members and guests. Boards: `PersonTimeline-Care*`, `MemberDetail-Timeline-Care`,
`MemberDetail-Activity-Care`.

- A new row component for `kind: "careLog"` (the API already skips nothing; staff-app skipped unknown
  kinds until now): date column with the time or *Care log*; tile by kind (amber when planned,
  neutral for *Someone told us*); title; badge *Planned* or *Record how it went* (amber, past due);
  meta (by, with, mode, also); text; the lock line (*Elders and her leaders* / *Elders only*); the
  source link; *Record how it went* (author or participant, past due) and *Edit* (author).
- **Coming up** heading above the months for planned entries still ahead, counted "N planned".
- Month headings count reports and care entries; the summary line still counts reports only.
- A **Care** chip after *Follow-up*, counting `counts.careLog` (Part 2 adds `counts.care`). Other
  chips hide care rows; care rows show only with *All groups*.
- **Log care** button (primary, plus icon) in the Timeline card header, for `careLog: create`.
- *Recent activity* (Profile tab) shows the 3 newest entries of any kind, coming-up ones first.

## Stage 4: *Log care* from reports, the conversation panel and Prayer & follow-up

Board: `CareMenu` (Part 1 shows only its first item).
- A ⋯ menu on each attendance row of Report detail with **Log care**, and the same item in the
  conversation panel's header and on each Prayer & follow-up entry and report item. It opens the
  form with **From** filled (attendance row, item or thread) and the people prefilled.
- Only for callers who can see that source and have `careLog: create`.

## Stage 5: *Coming up* on the dashboards

Boards: `LeaderDashboard-Care`, `LeaderDashboard-Elder-Care`, `LeaderDashboard-Care-Phone-Dark-ES`.
- Under *Waiting for your reply* on the leader dashboard and the elder Report status page: title
  *Coming up* with a neutral count, one line of explanation, then past-due rows (amber tile, *How did
  it go?* badge, *Record how it went* button) and upcoming rows (person link, what, date, time, with).
  No "see all" link. Hidden when both lists are empty.

## Stage 6: design review fixes (Part 1)

Run the checklist below against the Part 1 boards; record findings here.

---

# Part 2 (branch `care`)

## Stage 7: API types, client and server actions (care)

Types, client functions and server actions for the Part 2 routes. Actions check `care: view`,
`care: create` or `care: update` before calling the API; owner-only actions rely on the API's 403.

## Stage 8: the Care page and the sidebar item

**Files:** `app/(app)/care/page.tsx`, `_components/*`, `config/site.ts`, the sidebar. Boards:
`CareList*`, `Sidebar-Care`.
- Sidebar: **Care** / *Acompañamientos* after *Conversations*, for `care: view`, with `CareIcon` and
  a gold badge from `GET /care-cases/counts` → `badge`. The page makes the same check
  (`notFound()` otherwise).
- Header: eyebrow *People we're walking with*, title *Care*, a sub line per role, and **Start
  care**.
- Tabs with counts (`StatusTabs`): *Needs attention* (gold count when > 0), *Open*, *Unread*, *For
  prayer*, *Closed*. The tab is in the URL (`?tab=`).
- Filters: *All / Mine*, *Urgent only*, group select. Hidden on *For prayer*. A one-line hint under
  the filters on *Needs attention*, *Unread* and *For prayer*.
- Rows: initials avatar with the unread dot; title (bold when unread); *Urgent*; status; people ·
  groups · who can see it; the latest update clamped to two lines; on the right the check-in pill
  (overdue red, due amber, later neutral, closed green) and the owners, or *Needs an owner* with
  **Take it** (posts `take`, then opens the care). Phones stack the right column under the text.
- *For prayer*: cards with the summary in the serif face, "Shared by … · date", and *Open: {title}*
  only when the API returns the care.
- Empty states per tab (the `CareList-Empty` board for *Needs attention*). Skeleton while loading.

## Stage 9: a care's page

**Files:** `app/(app)/care/[id]/page.tsx`, `_components/*`. Boards: `CareDetail*`.
- Back link to *Care*. Header: status pill (a menu to switch *Open* ↔ *Monitoring* for managers; not
  drawn, use the existing menu pattern), *Urgent*, who can see it, title, people chips (to their
  Timeline), *Also: …* for others.
- Actions: **Add update** (primary; secondary when nobody owns it), **Close care** and *Edit care*
  for managers (`canManage`), **Take it** (primary) when nobody owns it, **Reopen** when closed.
- Banners: overdue (danger), due today (warning) for managers; *Needs an owner* for everyone; closed
  with the closing note (success).
- *What's going on* card (description, who started it, from what, the source link); the prayer
  summary card when there is one; **Updates**: entries (as on the timeline, with *Planned*) and
  events (small dotted lines on a tinted row), newest first, with a *New since you last looked*
  divider for unread. Opening the page posts `read` (explicit, not on GET).
- Details column (`aside`): next check-in pill and hint, owners (avatar, name, role) with *Add
  owner* (the owner picker, stage 10), who can see it with its description, about.
- **Add update**: the stage 2 form with `variant=care`: the care's title as the eyebrow, no visibility
  section (a "Seen by whoever can open this care" line instead), people optional, and for managers a
  **Next check-in** box pre-filled from `checkInSuggestionDays`. Others' updates never move the date.
- **Close care**: dialog with a required closing note; then the closed state.
- Phones: one column, details after the stream, actions full width.

## Stage 10: *Start care*, *Edit care*, *Add to care* and the care menu

Boards: `StartCareForm`, `StartCare-*`, `AddToCareDialog`, `AddToCare*`, `CareMenu`.
- **Start care** (dialog / sheet): guidance line; **From** card with the quoted source when started
  from one; *Title* (with its hint); *About* (+ others); *What's going on* (prefilled from the
  source); **Who can see it** with three radio cards and **nothing selected** (hint "Required.
  Nothing is chosen for you." in warning color until one is picked); *Owners* (*I'll own it*
  checkbox, other owners from `owner-options`, *Add owner*, and a hint that changes when there's no
  owner or when picking an owner grants access); *Urgent*; *Next check-in* (suggested 3 / 14 days);
  *+ Share a line with all leaders for prayer* opening the prayer summary field.
- Warnings: a leader choosing *Elders and owners* without owning it (`StartCare-Leader-Private`); an
  entry moving in, with the narrowing or widening from `move-preview` (`StartCare-FromCareLog`).
- **Edit care**: the same form, prefilled, *Save changes*.
- **Add to care**: search, "About {name}" first, then other open cares you can update; the moving
  note for entries.
- The ⋯ menu from stage 4 gains **Start care** (with `CareIcon`) and **Add to care…**; the timeline's
  care log rows get them too.

## Stage 11: *Care needing attention*, *Care started*, "In care", linked-care chips

Boards: `LeaderDashboard-*-CareFull`, `MemberDetail-Timeline-CareFull`, `PersonTimeline-CareFull-Leader`,
`CareMenu`.
- Dashboards: **Care needing attention** at the top (above *Waiting for your reply*): gold count, *All
  care* link, up to 3 rows (title, people · group, pills). Hidden when empty. *Coming up* stays below.
- Timeline: a `care` row (*Care started*, filled hands tile, owners, *Open care*), and "In care:
  {title}" links on entries inside a care. The *Care* chip counts both.
- Linked-care chips ("Care: {title}", `CareIcon`) on report rows, items, the conversation panel and
  Prayer & follow-up, from `GET /care-cases/linked`. Nothing for cares you can't open.

## Stage 12: design review fixes (Part 2)

Run the checklist below against the Part 2 boards; record findings here.

## Copy

New namespaces `CareLog` and `Care` (see "Adding UI text" in `CLAUDE.md`). The boards hold every
string in both languages; copy them from there verbatim. The main ones:

| Namespace.key | English | Español |
| --- | --- | --- |
| `Care.nav` | Care | Acompañamientos |
| `Care.title` | Care | Acompañamientos |
| `Care.eyebrow` | People we're walking with | Personas que acompañamos |
| `Care.start` | Start care | Iniciar acompañamiento |
| `Care.tabs.attention` | Needs attention | Requiere atención |
| `Care.tabs.open` | Open | Abiertos |
| `Care.tabs.unread` | Unread | Sin leer |
| `Care.tabs.prayer` | For prayer | Para orar |
| `Care.tabs.closed` | Closed | Cerrados |
| `Care.status.open` | Open | Abierto |
| `Care.status.monitoring` | Monitoring | En observación |
| `Care.status.closed` | Closed | Cerrado |
| `Care.urgent` | Urgent | Urgente |
| `Care.needsOwner` | Needs an owner | Sin responsable |
| `Care.take` | Take it | Tomarlo |
| `Care.owners` | Owners | Responsables |
| `Care.addOwner` | Add owner | Agregar responsable |
| `Care.checkIn` | Next check-in | Próxima revisión |
| `Care.overdue` | Overdue · {date} | Atrasada · {date} |
| `Care.dueToday` | Due today | Vence hoy |
| `Care.addUpdate` | Add update | Agregar novedad |
| `Care.close` | Close care | Cerrar acompañamiento |
| `Care.reopen` | Reopen | Reabrir |
| `Care.closingNote` | Closing note | Nota de cierre |
| `Care.what` | What's going on | Qué está pasando |
| `Care.updates` | Updates | Novedades |
| `Care.visibility.private` | Elders and owners | Ancianos y responsables |
| `Care.visibility.peoplesLeaders` | Elders, owners and their leaders | Ancianos, responsables y sus líderes |
| `Care.visibility.allLeaders` | All leaders | Todos los líderes |
| `Care.prayerSummary` | Prayer summary | Resumen para oración |
| `Care.attentionTitle` | Care needing attention | Acompañamientos que requieren atención |
| `Care.guide` | Write only what's needed to care well. Choose carefully who can see it. | Escribe solo lo necesario para cuidar bien. Elige con cuidado quién puede verlo. |
| `CareLog.eyebrow` | Care log | Registro de cuidado |
| `CareLog.log` | Log care | Registrar cuidado |
| `CareLog.kinds.call` | Call | Llamada |
| `CareLog.kinds.message` | Messages | Mensajes |
| `CareLog.kinds.meeting` | Meeting | Reunión |
| `CareLog.kinds.visit` | Visit | Visita |
| `CareLog.kinds.heard` | Someone told us | Nos contaron |
| `CareLog.kinds.note` | Note | Nota |
| `CareLog.planned` | Planned | Programada |
| `CareLog.record` | Record how it went | Registrar cómo fue |
| `CareLog.didntHappen` | It didn't happen | No se hizo |
| `CareLog.comingUp` | Coming up | Próximamente |
| `CareLog.visibility.leaders` | Elders and {name}'s leaders | Ancianos y líderes de {name} |
| `CareLog.visibility.private` | Elders only | Solo ancianos |
| `CareLog.errors.link` | Link your account to a member to log care. | Vincula tu cuenta a un miembro para registrar cuidado. |

## Not in this spec

- Email and push for care (rule 41), configurable check-in suggestions, categories, attachments,
  @mentions, prayer summaries on Prayer & follow-up and *Copy for WhatsApp* for them (rules 42–45).
- The person seeing anything about their own care (rule 43).

## Design review checklist

Run after each part, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; the Care list stacks its right
      column below `md`; dialogs become bottom sheets on phones.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] `CareIcon` is the filled hands everywhere care appears; prayer keeps the heart.
- [ ] Nothing about a care you can't open shows anywhere: lists, counts, chips, timeline.
- [ ] Focus ring visible on every control; focus after dialogs returns to the opener.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
