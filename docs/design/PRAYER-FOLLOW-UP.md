# Prayer & follow-up: weekly prayer, praise and follow-up page, Dashboard renames

Implementation spec for **Prayer & follow-up** (Dashboard ▸ Prayer & follow-up in the sidebar,
`/dashboard/prayer`), which is new. Read the cross-repo spec first:
`../docs/specs/prayer-follow-up.md` (workspace folder `members-management/docs/specs/`); its rules
are referred to as *rule N*. After this work:

- **Menu.** Admins and elders get Dashboard ▸ **Report status** (was *Groups*, `/`) /
  **Prayer & follow-up** (`/dashboard/prayer`) / **Applications & access** (was *Staff*,
  `/dashboard/staff`). Leaders and deacons get Dashboard ▸ **My groups** (`/`) / **Prayer &
  follow-up** (their groups only). `none` keeps its single Dashboard item.
- **Prayer & follow-up:** the week's prayer requests, praise and follow-up items from every group's
  report (a leader's own groups for leaders), with the Report status week stepper, filter chips, a *still to report* note, *Copy for
  WhatsApp*, and a conversation control per entry that opens the conversation panel on the page.
- **Section threads** (stage 5): a conversation about one of those texts, opened from this page or
  from Report detail.

**Decided:** everything in the cross-repo spec's *Rules*, plus these UI decisions (don't reopen):

- URLs of the renamed items **don't change** (`/` and `/dashboard/staff`); only labels, page
  titles and nav keys do.
- One page for the three texts, not three pages. Prayer first. The filter chips are page state
  (`useState`), not in the URL; the week is in the URL (`?week=`) as on `/`.
- Week title and stepper exactly as Report status: *This week*, *Last week*, otherwise
  *Week of {Sunday}*; next disabled on the current week.
- Sections are cards (`card()`), entries are list rows: group block on the left (name, leaders,
  date), text and actions on the right; they stack below `md`.
- The text is shown as written, `whitespace-pre-line`, capped at a readable measure (`max-w-[72ch]`).
- Follow-up gets the warning tone on its icon tile and count pill (it asks for action); prayer the
  accent-soft tone; praise the success tone. Only the tile and pill, never the text.
- Copy goes through `navigator.clipboard.writeText`. The toast stays up about 4 s. No copy on
  follow-up, ever (rule 12).

**Depends on the API:** `membership-management/docs/PRAYER-FOLLOW-UP-API-HANDOFF.md`: stage 1
there for stages 2–4 here; stages 2–4 there for stage 5 here. Stage 1 here needs nothing new. If a
stage starts before the API is ready, note it and stub nothing in committed code.

**Email is out of scope.** Report conversations Part 2 (`docs/design/REPORT-CONVERSATIONS-EMAIL.md`)
is still pending and comes **after** this feature, worked slowly as a learning exercise. Don't touch
its stages. It already has a note at the top pointing to the spec's *Changes for report
conversations Part 2*.

Work through it **stage by stage**, one reviewable commit per stage, on the **`prayer-follow-up`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each
stage, write a short summary of what changed and anything that differs from the canvas in the
progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Small group reports"**, rows **"Dashboard ▸ Prayer & follow-up · admin/elder weekly
  view"**, **"… · conversation panel on the page"** and **"… · dark, 1024, 390 and the leader
  view"**, and the blue note. The page boards are clickable in Play (chips, copy, toast, week
  stepper, conversation links).
- **Boards:** `PrayerFollowUp` (this week: 4 groups still to report, an urgent request),
  `PrayerFollowUp-LastWeek` (5 reports, *Copy all*, a follow-up with an existing thread). Tweaks:
  mode, lang, size, user (`admin` / `elder` / `leader`), week, toast, thread, filter.
  `PrayerFollowUp-Dark-ES`, `PrayerFollowUp-Tablet` (1024), `PrayerFollowUp-Phone` (390: top bar,
  entries stack group → text → actions, actions wrap), `PrayerFollowUp-Phone-Sheet-Dark-ES` (the
  conversation as a bottom sheet), `PrayerFollowUp-Leader` (Andrea's two groups only, 1 still to
  report, *My groups* links). The menu: `Sidebar` (`active = dashPrayer`; `user = leader` shows the
  leaders' submenu). Applications & access: `Dashboard` / `Dashboard-Dark` on page "Dashboard &
  applications".
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced from `tokens/`.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Menu renames and the route | ✅ | `19ee68f` |
| 2. API types and client (shared endpoint, anchor union) | ✅ | `6b5e61c` |
| 3. The page: week, chips, still to report, sections | ✅ | this commit |
| 4. Copy for WhatsApp | ⬜ | |
| 5. Section threads: page control, Report detail, panel | ⬜ | |
| 6. Section threads in Conversations and *Waiting for your reply* | ⬜ | |
| 7. Docs | ⬜ | |
| 8. Design review fixes (after the variant boards exist) | ⬜ | |

### Decisions and deviations

- **Stage 1:** the `scoped` Dashboard item is a group (`unless: smallGroups all`, children
  `requires: smallGroups view`), and the single `none` item is now `unless: smallGroups view`
  (admin and elder carry `view` too, so it stays hidden for them). Neither renamed page had a
  title (both headers are the greeting), so *page titles* means the tab title: `/` gets
  `generateMetadata` with *Report status* / *My groups* / *Dashboard* by access, and
  `/dashboard/staff` gets *Applications & access*. Only `title`, `subtitle` and `subtitleLeader`
  of `PrayerDashboard` were added; the other keys come with the stages that use them.
  `/dashboard/prayer` is a static route, so `[...slug]` never takes it; `isActivePath` matches
  `/` exactly, so only one child is marked on each URL.
- **Stage 2:** the shared types sit next to the week ones in `api/small-groups-api/types.ts`
  (`ReportSectionKey` too, since the conversation types import it); `ReportStillToReport.status` is
  `Extract<ReportWeekStatus, …>` and `conversations` is a `Partial<Record<…>>`, both as the API
  sends them. Besides inbox rows, `ConversationThread.member` is nullable too (the API made it so for
  section threads); Report detail's panel name reads `thread?.member?.name`. Inbox rows narrow
  through `isPersonInboxItem` (`lib/conversation-format.ts`), and `ConversationRow` /
  `conversationHref` take a `PersonInboxItem`, so stage 6 is where the type stops them. The
  Conversations list keeps every row it fetched (so *Show more* asks from the right offset) and
  renders only person rows. Until stage 6 the inbox tab counts and the *Waiting for your reply*
  pill still include section threads, since they come from the API. The attendance card's indicators
  and its summary (count and *needs your reply*) are derived from person summaries, the same way
  the API derives `counts`. `getSectionConversation` / `addSectionComment` land in stage 5 with
  their server actions. Checked: `tsc`, and the local API's OpenAPI has the three new routes.
- **Stage 3:** the week title moved to `report-week/week-title.ts` (`weekTitle()`), used by Report
  status and this page, with the `GroupsDashboard` keys (*This week* / *Last week* / *Week of*)
  rather than copies. `WeekStepper` takes `basePath`. *No open groups* is read from
  `getSmallGroupReportSummary()` (cached; it lists the open groups in scope), since the shared
  texts can't tell an empty week from no groups: full roles get `NoGroupsCard`, scoped roles the
  *You don't lead a small group yet* state. A scoped account with no member gets the *not linked*
  state without calling the API. A failed read throws to `(app)/error.tsx` (the shared
  `ErrorState`). `PrayerFilter` (client) takes the translated chip labels, the note and the three
  server-rendered sections as props, and hides sections with `hidden`. The week block is in a
  `Suspense` keyed by week (skeleton while stepping), and `loading.tsx` adds the header skeleton.
  **Still to report:** groups next to each other with the same status (and, for upcoming, the same
  day) share it, names joined with `Intl.ListFormat` (*A and B (due)*), as on the board; a past
  week joins the names the same way (the board uses commas there). Two keys not in the copy table:
  `stillGroups` (`{names} ({status})`) and `stillList` (`{list}.`). `stillDue`, `stillToday` and
  `stillUpcoming` take `n`, so *A and B (pendientes)* / *(meet today)* agree with the count. New
  `formatCalendarWeekday()` for *meets Friday* / *se reúne el viernes*. Each entry shows only
  *View report* for now (copy is stage 4, the conversation control stage 5). Checked in the browser
  as admin: this week and last week, dark and light, the Follow-up chip, English and Spanish at 1024,
  and 390 (entries stack, no horizontal scroll). The leader view isn't checked yet (needs a leader
  account).

## Token changes

None expected: the page uses the tones Report status and Report detail already use (accent-soft,
success, warning, neutral). If you find you need one, stop and list it here first.

New Tailwind utilities needed: none.

## The API

See the cross-repo spec's *Contracts* for the shapes.

| Call | Used by |
| --- | --- |
| `GET /small-group-reports/shared?date=` | Stage 3 (page), stage 5 (`conversations` on each entry) |
| `GET /small-group-reports/{id}/conversations/sections/{key}` | Stage 5 (panel) |
| `POST /small-group-reports/{id}/conversations/sections/{key}/comments` | Stage 5 (composer) |
| Inbox / summaries with `anchor` union | Stages 2, 6 |

Errors the page tells apart (never show `detail`):

| Status | `detail` contains | Meaning / UI |
| --- | --- | --- |
| 422 | `future` | Can't happen from the UI (the param is clamped first); generic error |
| 422 | `section is empty` | Starting a thread on an empty section; only reachable by a stale page: generic error and refresh |
| 403 | | Not reachable for full roles; generic error |

## Stage 1: Menu renames and the route

**Files:** `config/site.ts`, `messages/en.json`, `messages/es.json`,
`app/(app)/dashboard/prayer/page.tsx` (new), `app/(app)/_components/prayer-dashboard.tsx` (new),
plus wherever `dashboardGroups` / `dashboardStaff` are read.

- Rename the nav keys to match their labels: `Nav.dashboardGroups` → `Nav.dashboardReportStatus`
  (*Report status* / *Estado de reportes*), `Nav.dashboardStaff` →
  `Nav.dashboardApplicationsAccess` (*Applications & access* / *Solicitudes y acceso*); add
  `Nav.dashboardPrayer` (*Prayer & follow-up* / *Oración y seguimiento*). Update `NavLabelKey`.
- `config/site.ts`, the `full` Dashboard item: children in this order: Report status (`/`), Prayer &
  follow-up (`/dashboard/prayer`), Applications & access (`/dashboard/staff`).
- The `scoped` Dashboard item becomes a group too: My groups (`/`, new key `Nav.dashboardMyGroups`,
  *My groups* / *Mis grupos*), Prayer & follow-up (`/dashboard/prayer`). `none` stays a single item.
- Page titles (`generateMetadata` / page headers) of the two renamed pages follow the new labels.
  The Report status page body is otherwise unchanged.
- `app/(app)/dashboard/prayer/page.tsx`: full and scoped roles render `PrayerDashboard` (header
  only in this stage: eyebrow date, *Prayer & follow-up*, subtitle; the subtitle has a leader
  variant); `none` → `redirect("/")`.
- Check `CollapsibleItem` marks only the right child on each of the three URLs, and that the
  catch-all `[...slug]` doesn't take `/dashboard/prayer`.

## Stage 2: API types and client

**Files:** `api/small-groups-api/` (client and types), `lib/conversation-format.ts`, and every
reader of a conversation summary or inbox row.

- Types for the shared endpoint (`ReportShared`, `ReportSharedEntry`, `ReportStillToReport`,
  `ReportSectionKey = "prayer" | "praise" | "followUp"`) and `getSmallGroupReportShared(date?)`,
  next to `getSmallGroupReportWeek`.
- **Anchor union:** `ConversationAnchor = { type: "attendance"; memberId: number } | { type:
  "section"; key: ReportSectionKey }`. Inbox rows: `member` becomes `… | null`. Fix every place that
  reads `summary.anchor.memberId` or `row.member` so it narrows on `type` first. Report detail's
  per-row indicators must **ignore section summaries** in this stage (they're shown in stage 5).
  `conversation-row.tsx` (Conversations and *Waiting for your reply*) reads `item.member.name`
  today: until stage 6, **skip section rows** there (filter them out) so a section thread can never
  crash the inbox. This stage must be deployed before or with the API's section-thread routes.
  Nothing visible changes; `tsc` is the check.
- Client functions for the two section routes (`getSectionConversation`, `addSectionComment`) can
  land here or in stage 5; note which.

## Stage 3: The page (`/dashboard/prayer`)

**Files:** `app/(app)/_components/prayer-dashboard.tsx`, a `prayer/` folder beside `report-week/`
for its parts (`prayer-section.tsx`, `prayer-entry.tsx`, `prayer-filter.tsx`,
`still-to-report-note.tsx`, `prayer-skeleton.tsx`), `app/(app)/dashboard/prayer/loading.tsx`.

### Week

- `?week=` read and clamped exactly as `/` does (share the helper; don't copy it).
- **`WeekStepper` gets a `basePath` prop** (today it hardcodes `/?week=`); Report status passes
  `/`, this page `/dashboard/prayer`. The *Report status* link sits left of the stepper, as on the
  board.
- Week title (*This week* / *Last week* / *Week of …*) and the subtitle *Reports from Sunday to
  Saturday.*

### Filter chips (rule 10)

- A `role="group"` of toggle buttons (`aria-pressed`): *All* (no count), *Prayer*, *Praise*,
  *Follow-up*, each with its entry count in a pill. Selected = accent fill. Client component; the
  sections are rendered on the server and the filter only hides them (`hidden` attribute), so
  switching never refetches.
- Keyboard: Tab to the group, each chip is a button. No roving tabindex needed for four buttons.

### Still to report (rule 11)

- Neutral note under the chips, clock icon: *{n} groups haven't sent this week's report yet, so more
  may show up here:* then the names with a short status in brackets (*due*, *meets today*, *meets
  {weekday}*), then *See report status* → `/?week=…` (same week). Past weeks: *{n} groups didn't
  file a report that week:* and the names. Hidden when `stillToReport` is empty.

### Sections (rules 7–9)

- Three `<section aria-labelledby>` cards in order Prayer, Praise, Follow-up: icon tile (heart,
  sparkles, flag), title in the serif heading style, a count pill (*{n} groups*), a one-line
  description, then the entries as a `<ul>`.
- Entry: group name (semibold), leaders, short meeting date on the left; the text and an action row
  on the right: *Copy for WhatsApp* (prayer and praise; stage 4), the conversation control (stage
  5), *View report* (link to `/groups/reports/{reportId}`, underlined link style).
- Empty section: one italic muted line (*No group has shared a prayer request yet this week.* /
  *…that week.*); the section and its chip still show (count 0).
- Leaders' names joined with ` · ` as on Report status.
- **Below `md`** (phone board): the app's top bar replaces the sidebar; each entry stacks group →
  text → actions; action buttons are 44 px tall and wrap; *Copy all* drops under the section title.

### States

- Loading: skeleton of the header, chips and one section card (`loading.tsx`).
- No open groups at all: the `NoGroupsCard` (as Report status). A scoped user who leads no group:
  the leader dashboard's empty state (*You don't lead a small group yet*), and an unlinked account
  its *not linked* state, reusing those components.
- **Leaders:** header link and *still to report* link say *My groups* and go to `/`; the subtitle,
  the Prayer description and the Follow-up description use the leader copy below.
- A week where nobody shared anything: the three empty lines; nothing special.
- API error: the shared `ErrorState`.

## Stage 4: Copy for WhatsApp (rules 12–13)

**Files:** `prayer/copy-for-whatsapp.tsx` (client), `prayer/whatsapp-text.ts` (pure formatting),
`components/toast-host.tsx` (only if extended).

- `whatsappEntryText(section, entry, t, locale)` and `whatsappAllText(entries, weekRange, t,
  locale)`: pure functions, the exact format in rule 13, titles and dates in the viewer's language
  (the same short date the entry shows). Keep them pure so they're easy to read and to unit-test
  later.
- Button: outline, copy icon, *Copy for WhatsApp*; `aria-label` adds the group
  (*Copy for WhatsApp: Mujeres de Fe*). *Copy all for WhatsApp* in the Prayer section header when it
  has 2+ entries.
- On success, `showToast`: title *Copied for WhatsApp* (or *Prayer requests copied for WhatsApp*)
  and the line *Check names and details before you share it.* `showToast` takes one message today:
  add an optional second line rather than joining them into one string, and note it. On failure
  (no clipboard, permission denied): danger toast *Couldn't copy. Select the text and copy it
  instead.*
- Never on follow-up: the component isn't rendered there, not just disabled.

## Stage 5: Section threads (page control, Report detail, panel)

> **Boards:** `ReportDetail-SectionNew` (elder starts a thread on Prayer requests: empty panel,
> composer focused) and `ReportDetail-SectionThread` (a follow-up thread waiting for the elder's
> reply, *New* divider), same row as the Prayer & follow-up boards; `PrayerFollowUp-SectionNew` and
> `PrayerFollowUp-SectionThread` (row "Prayer & follow-up · conversation panel on the page") for
> the panel open over this page. Tweaks on `ReportDetail` /
> `ThreadPanel`: `thread` / `topic` = `sectionNew` | `sectionOpen`. Every other `ReportDetail` board
> (dark, ES, 1024, 390, leader) now shows the section indicators too.

**Files:** `prayer/prayer-entry.tsx`, `groups/reports/_components/report-shared-card.tsx`,
`conversation-panel.tsx`, `conversation-indicator.tsx`, `groups/reports/[id]/page.tsx`, server
actions for the section routes.

- **This page** (rule 15): no thread → *Start a conversation* (outline link with the chat icon);
  with a thread → the comment count (amber + gold dot when `needsMyReply`, as the row indicator).
  Both link to `/dashboard/prayer?week=…&report={reportId}&section={key}` (keep `week`; drop it for
  the current week as usual) and open the panel **on this page**: the page reads `report` and
  `section` like Report detail reads `?section=`, loads that thread server-side and mounts the same
  panel. The entry gets the focused-row treatment (gold inset edge, focus background). The filter
  chips keep their state because only the search params change (`router.push` with `scroll: false`).
  Closing removes `report` and `section`, returns focus to the control that opened it, and
  refreshes the page so the count updates. The panel header adds *View full report*
  (`/groups/reports/{reportId}?section={key}`, which opens the same thread there).
- **Report detail:** `?section=` read and validated like `?person=` (`prayer | praise | followUp`;
  anything else ignored). A section and a person in the same URL: person wins. Each section of the
  *What the group shared* card gets the conversation indicator from the report's summaries, right
  of its title: the same component and states as the attendance row (muted bubble+plus to start,
  count pill, amber + gold dot when it needs your reply, green check when resolved). **A section
  with no text shows no control** (rule 14). With `?section=`, that section gets the focused-row
  treatment (gold inset edge, focus background). The attendance card's conversation summary keeps
  counting person threads only.
- **Panel:** generalise `ConversationPanel` from `person` to an anchor, and make it host-agnostic:
  the close target, the element to highlight and the optional *View full report* link become props,
  so Report detail and this page mount the same component. The draft key stays per report + anchor,
  so a draft started on one page is there on the other. For a section the header
  shows the section's icon tile (heart / sparkles / flag; flag on the warning tone) and its title
  instead of the avatar and name; the context box shows *Shared by {submitter} in the report* and the
  text (serif italic, line breaks kept) instead of the attendance pills and observation; the empty
  state and placeholder say *about the prayer requests* / *the praise* / *the follow-up items*; drafts keyed by
  anchor (`conversation-draft:{reportId}:section:{key}`); the highlighted element is the section
  (`data-conversation-section`). Same composer, comments, resolve, read-on-open. With no thread it
  opens on the composer, focused.
- Phone: the same bottom sheet.

## Stage 6: Section threads in Conversations and *Waiting for your reply*

**Files:** `conversations/_components/*`, `_components/waiting-for-reply-card.tsx`.

- Rows whose anchor is a section show the section title (*Prayer requests* / *Praise* / *For the
  elders to follow up*) where the person's name goes, a section icon instead of initials, and link
  to `?section=`. Group, date, last comment and badges unchanged.

## Stage 7: Docs

- `docs/design/REPORT-CONVERSATIONS.md`: one line under its title saying section threads were added
  by this handoff.
- `docs/design/GROUPS-DASHBOARD.md`: one line saying Groups is now *Report status* and Staff is
  *Applications & access* (labels only).
- Tick the progress log.

## Stage 8: Design review fixes

Run the checklist below against every board listed above (dark / Spanish / 1024 / 390 / leader
included) and fix what differs.

## Copy

New keys under `PrayerDashboard` unless noted. `{n}` and `{group}` are ICU arguments.

| Namespace.key | English | Español |
| --- | --- | --- |
| `Nav.dashboardReportStatus` | Report status | Estado de reportes |
| `Nav.dashboardPrayer` | Prayer & follow-up | Oración y seguimiento |
| `Nav.dashboardApplicationsAccess` | Applications & access | Solicitudes y acceso |
| `title` | Prayer & follow-up | Oración y seguimiento |
| `subtitle` | What the small groups shared in this week’s reports, to pray over and follow up. | Lo que compartieron los grupos pequeños en sus reportes de la semana, para orar y dar seguimiento. |
| `weekSub` | Reports from Sunday to Saturday. | Reportes de domingo a sábado. |
| `reportStatusLink` | Report status | Estado de reportes |
| `filterLabel` | Show | Mostrar |
| `filterAll` | All | Todo |
| `filterPrayer` | Prayer | Oración |
| `filterPraise` | Praise | Alabanza |
| `filterFollowUp` | Follow-up | Seguimiento |
| `prayerTitle` | Prayer requests | Peticiones de oración |
| `praiseTitle` | Praise | Motivos de alabanza |
| `followUpTitle` | For the elders to follow up | Para seguimiento de los ancianos |
| `prayerSub` | From each group’s report. Copy one to share it in a WhatsApp group. | De los reportes de cada grupo. Copia una para compartirla en un grupo de WhatsApp. |
| `praiseSub` | What the groups are thankful for this week. | Lo que los grupos agradecen a Dios esta semana. |
| `followUpSub` | What the leaders want an elder to know or act on. | Lo que los líderes quieren que un anciano sepa o atienda. |
| `groupCount` | {n, plural, one {# group} other {# groups}} | {n, plural, one {# grupo} other {# grupos}} |
| `emptyPrayerThis` | No group has shared a prayer request yet this week. | Ningún grupo ha compartido peticiones de oración esta semana. |
| `emptyPrayerPast` | No group shared a prayer request that week. | Ningún grupo compartió peticiones de oración esa semana. |
| `emptyPraiseThis` | No group has shared a praise report yet this week. | Ningún grupo ha compartido motivos de alabanza esta semana. |
| `emptyPraisePast` | No group shared a praise report that week. | Ningún grupo compartió motivos de alabanza esa semana. |
| `emptyFollowUpThis` | Nothing for the elders to follow up yet this week. | Nada para seguimiento de los ancianos esta semana. |
| `emptyFollowUpPast` | Nothing for the elders to follow up that week. | Nada para seguimiento de los ancianos esa semana. |
| `stillThisWeek` | {n, plural, one {# group hasn’t sent this week’s report yet, so more may show up here:} other {# groups haven’t sent this week’s report yet, so more may show up here:}} | {n, plural, one {# grupo aún no envía el reporte de esta semana, así que pueden aparecer más:} other {# grupos aún no envían el reporte de esta semana, así que pueden aparecer más:}} |
| `stillPastWeek` | {n, plural, one {# group didn’t file a report that week:} other {# groups didn’t file a report that week:}} | {n, plural, one {# grupo no envió reporte esa semana:} other {# grupos no enviaron reporte esa semana:}} |
| `stillDue` | due | pendiente |
| `stillToday` | meets today | se reúne hoy |
| `stillUpcoming` | meets {weekday} | se reúne el {weekday} |
| `seeReportStatus` | See report status | Ver estado de reportes |
| `copy` | Copy for WhatsApp | Copiar para WhatsApp |
| `copyAria` | Copy for WhatsApp: {group} | Copiar para WhatsApp: {group} |
| `copyAll` | Copy all for WhatsApp | Copiar todas para WhatsApp |
| `copied` | Copied for WhatsApp | Copiada para WhatsApp |
| `copiedAll` | Prayer requests copied for WhatsApp | Peticiones copiadas para WhatsApp |
| `copiedNote` | Check names and details before you share it. | Revisa los nombres y detalles antes de compartirla. |
| `copyFailed` | Couldn’t copy. Select the text and copy it instead. | No se pudo copiar. Selecciona el texto y cópialo. |
| `startConversation` | Start a conversation | Iniciar conversación |
| `ReportConversations.viewFullReport` | View full report | Ver el reporte completo |
| `startAria` | Start a conversation: {section}, {group} | Iniciar conversación: {section}, {group} |
| `commentCount` | {n, plural, one {# comment} other {# comments}} | {n, plural, one {# comentario} other {# comentarios}} |
| `viewReport` | View report | Ver reporte |
| `Nav.dashboardMyGroups` | My groups | Mis grupos |
| `subtitleLeader` | What your groups shared in this week’s reports, to pray over and follow up. | Lo que compartieron tus grupos en sus reportes de la semana, para orar y dar seguimiento. |
| `prayerSubLeader` | From your groups’ reports. Copy one to share it in the group’s WhatsApp. | De los reportes de tus grupos. Copia una para compartirla en el grupo de WhatsApp. |
| `followUpSubLeader` | What your groups asked an elder to know or act on. | Lo que tus grupos pidieron que un anciano sepa o atienda. |
| `myGroupsLink` | My groups | Mis grupos |
| `seeMyGroups` | See my groups | Ver mis grupos |
| `stillThisWeekLeader` | {n, plural, one {# of your groups hasn’t sent this week’s report yet:} other {# of your groups haven’t sent this week’s report yet:}} | {n, plural, one {# de tus grupos aún no envía el reporte de esta semana:} other {# de tus grupos aún no envían el reporte de esta semana:}} |
| `viewReportAria` | View report: {group}, {date} | Ver reporte: {group}, {date} |

The WhatsApp text reuses `prayerTitle` / `praiseTitle` and the entry's short date.

## Not in this spec

- Email for any conversation (report conversations Part 2, next, done slowly).
- A share sheet or `wa.me` link on phones (rule 12: copy only, on purpose).
- Handled flags, multi-week ranges, printing, exports, editing the texts from this page (rule 18).

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; entries stack below `md`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Token changes (if any) are in `tokens/`, `pnpm tokens --check` passes.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] Focus ring visible on every control; chips announce pressed state; focus stays on the copy
      button after copying.
- [ ] Copied text matches rule 13 exactly in both languages (paste it into WhatsApp once).
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
