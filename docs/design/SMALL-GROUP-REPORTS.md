# Small group reports: list, detail, new/edit flow and entry points

Implementation spec for **small group reports** (Groups › Reports in the sidebar,
`/groups/reports`, `/groups/reports/new`, `/groups/reports/[id]`, `/groups/reports/[id]/edit`),
which is a stub today (`app/(app)/groups/reports/page.tsx`, an `EmptyState`). Read the cross-repo
spec first: `../docs/specs/small-group-reports.md` (workspace folder `members-management/docs/specs/`);
its rules are referred to as *rule N*, and the leader access spec's as *access rule N*. After this
work:

- **Reports list.** Admins and elders see every group's reports with filters (group, date range,
  status, search). Leaders and deacons see *My reports*. Past meetings without a report show as
  **Not filed**.
- **Report detail.** Meeting info, what the group shared, the attendance table with totals.
  Observations show only to admins, elders and the report's submitter.
- **New report.** Meeting step, then the leader picks *One person at a time* (a card per person)
  or *Quick list*. Both end on the full list, which is also the **Edit** screen.
- **Entry points.** A "Recent meetings" card on Group detail and a *My groups* dashboard for
  leaders.

**Decided:** everything in the cross-repo spec's *Rules*, plus these UI decisions (don't reopen):

- The new-report flow **always asks** which mode; no remembered preference.
- One person at a time: one card per person (avatar, name, role, hint), two Yes/No questions and
  an optional note. **No auto-advance**: the leader presses **Next person**, so the note isn't
  skipped. **Skip to the full list** is always there.
- Order: meeting → people → the group (prayer, praise, discussion) → review. The quick list shows
  people and the three sections on one screen.
- Every person must be answered before **Submit report** is enabled (rule 3). No "mark all" button.
- The church question names the real Sunday ("Was Daniela at church on Sunday, Oct 11?") using
  `churchSunday` from the API (rule 12). Questions use the person's first name; copy never uses
  gendered pronouns.
- The duplicate-date check runs on the **date step** (roster `existingReportId`), before anyone is
  marked, with a link to the existing report.
- An unsent report is kept as a **browser draft** (`localStorage`, key
  `ekk-report-draft:{groupId}:{meetingDate}`, wrapped in try/catch) so a phone call mid-flow
  doesn't lose answers; cleared on submit or **Cancel**. Restored silently when the same group and
  date are opened again.
- Avatars are `InitialsAvatar`; a photo will later use the same circle (out of scope).
- Hide what a role can't use, except **New report** for an admin or elder with no linked member:
  shown disabled with the reason (rule 5), as the board shows.

**Depends on the API:** `membership-management/docs/SMALL-GROUP-REPORTS-API-HANDOFF.md` (all
stages) and small group leader access in both repos (`docs/design/SMALL-GROUP-LEADER-ACCESS.md`,
for `getSmallGroupAccess` and the scoped lists). If a stage starts before the API is ready, note it
and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`small-group-reports`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, in English and
Spanish, before the next one starts. After each stage, write a short summary of what changed and
anything that differs from the canvas in the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Small group reports"**, plus the updated `GroupDetail` board on page "Small groups".
  Every report board has Tweaks for mode, lang and size, so any combination can be checked. The
  *New report* boards are clickable in Play. The blue rules note on the page matches the spec.
- **Boards:**
  - List: `Reports` (admin/elder), `Reports-Leader`, `Reports-Unlinked` (New report disabled),
    `Reports-Empty`, `Reports-NoLink`, `Reports-NoGroups-ES`, `Reports-Dark` (deleted toast),
    `Reports-Leader-Dark-ES`, `Reports-Tablet`, `Reports-Tablet-ES`, `Reports-Phone`,
    `Reports-Phone-Leader-Dark-ES`.
  - Detail: `ReportDetail` (elder, observations), `ReportDetail-Leader` (co-leader's report, no
    observations), `ReportDetail-Submitted` (own report, toast), `ReportDetail-Delete`,
    `ReportDetail-Closed` (read-only), `ReportDetail-Dark`, `ReportDetail-Tablet-ES`,
    `ReportDetail-Phone`, `ReportDetail-Phone-Leader-Dark-ES`.
  - Form: `ReportForm` (meeting + mode choice), `ReportForm-DatePicker`, `ReportForm-Duplicate`,
    `ReportForm-Person`, `ReportForm-Person-Note`, `ReportForm-Group`, `ReportForm-Review`,
    `ReportForm-Quick`, `ReportForm-Edit`, `ReportForm-Dark`, `ReportForm-Tablet-ES`,
    `ReportForm-Phone-Start`, `ReportForm-Phone-Person`, `ReportForm-Phone-Person-Note`,
    `ReportForm-Phone-Person-Dark-ES`, `ReportForm-Phone-Quick`.
  - Entry points: `LeaderDashboard`, `LeaderDashboard-Dark-ES`, `LeaderDashboard-Tablet`,
    `LeaderDashboard-NoLink`, `LeaderDashboard-Phone`; `GroupDetail` (Recent meetings card) and
    `GroupDetail-Closed` on page "Small groups".
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced 2026-10-15.

The canvas boards are drawn with inline hex values; build with the semantic tokens and shared
components named below, never the board's literals.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API client, types, actions, errors | ✅ | 4d16182 |
| 2. Reports list (`/groups/reports`) | ✅ | (this commit) |
| 3. Report detail and delete | ⬜ | |
| 4. New report: meeting step | ⬜ | |
| 5. New report: one person at a time, the group, review | ⬜ | |
| 6. Quick list and edit | ⬜ | |
| 7. Entry points: Group detail card, leader dashboard | ⬜ | |
| 8. Review pass | ⬜ | |

### Decisions and deviations

- **Stage 1: names are one `name`.** The API sends `{ memberId, name }` everywhere, not first and
  last (API handoff log). Types use `name`; the spec's "first name" in the questions (`q1`, `q2`,
  `addNote`) is taken as the first word of `name`.
- **Stage 1: not-filed rows are for open groups only** (API handoff log). So a closed group never
  shows a *Not filed* row.
- **Stage 1: `ApiErrors.groupClosed` added.** The spec says "existing closed-group key", but the only
  closed keys live under `GroupMembers`/`GroupClose` and say the group "can't be changed"; reports
  need their own sentence.
- **Stage 1: `reportAccess` lives in `lib/auth/roles.ts`** next to `getSmallGroupAccess` (client-safe).
  `getApiErrorMessage` takes an optional `{ date }` for `reportExists`; `getReportErrorKind` and
  `getExistingReportId` expose the matching so actions can return a kind to the form.
- **Stage 1: date-only formatters** `formatCalendarShortDate`, `formatCalendarMediumDate` and
  `formatCalendarFullDate` added to `lib/format-date.ts` (UTC, like `formatCalendarDate`), since report
  dates have no time zone.
- Verified: types checked against the running API's OpenAPI schemas (`localhost:8000`).
- **Stage 2: church time zone.** "Today" for the default date range (and later the date picker and
  "Meets today") needs the church's day, not UTC or the server's. New optional env
  `CHURCH_TIMEZONE` (default `America/Managua`, same as the API's `church_timezone`; in
  `.env.example`), read by `getChurchToday()` in `lib/church-time.ts`. Keep it equal to the API's.
- **Stage 2: new dependency `@internationalized/date`** (3.12.4, already in the store through
  HeroUI): the HeroUI date range picker takes its `CalendarDate` values.
- **Stage 2: `DataTableFooter` now pages.** It takes optional `page`, `pageSize` and `onPageChange`;
  callers that pass only `total` behave as before.
- **Stage 2: `ReportsList.countOf` is `{count, number} of {total, number}`** (the spec has plain
  `{count}`), because a bare ICU argument is typed `string` and these are numbers.
- **Stage 2: extra keys** `ReportsList.closed`, `closedOption`, `done`, `fileReportLabel`,
  `tableLabel`, `noMatches`, `results`. `ReportsPage.noMatchesTitle`/`clearFilters` reach the client
  browser as props so `ReportsPage` stays a server namespace; `ReportsList` is a client namespace.
- **Stage 2: date range is HeroUI's `DateRangePicker`** (editable segments plus a calendar), not the
  button-style range of the board; it behaves the same and is keyboard accessible.
- **Stage 2: "Show more" on phones** appends the next page through `listReportsPageAction`; the
  table uses the URL `page` param.
- Verified (Stage 2): signed in as the local admin (no linked member), in light and dark, English
  and Spanish, at 1440 and the real 1024/390 viewports (a same-origin iframe, since the browser
  window can't go below ~2000px here). Status tabs and URL filters work; **New report** is disabled
  with its reason; no sideways scroll at 390; the Filters sheet opens. Not yet seen: the scoped
  (leader/deacon) and linked variants, and the empty states; those need other accounts (Stage 8).

## Token changes

None. Everything maps to existing semantic tokens:

| Board element | Token / component |
| --- | --- |
| Filed / Attended / At church badges | `StatusBadge` success (filled dot) |
| Not filed badge, "Missed the last N" hint, not-filed row tint | warning soft (`warning-soft`, `warning-soft-foreground`), hollow dot |
| Absent / Not at church | `StatusBadge` neutral, hollow dot |
| Yes selected (attendance buttons) | `success-soft` fill, `success-soft-foreground` text and border, check icon |
| No selected | `default` fill, `foreground` text, `muted` border, x icon |
| Prayer, praise, discussion text | the `testimony` type style (Newsreader italic 17px) |
| Progress bar segments | done `accent`, current `focus`-coloured, to do `border` |

New Tailwind utilities needed (`@theme inline` in `globals.css`): none expected. If the testimony
style isn't a utility yet, note it in the log before adding one.

## The API

New functions in `api/small-groups-api/client.ts` (types in `types.ts`, shapes exactly as in the
API handoff's *Shapes*; `kind` is a discriminated union for list items):

| Function | Call |
| --- | --- |
| `listSmallGroupReports(params)` | `GET /small-group-reports` |
| `getSmallGroupReportSummary()` | `GET /small-group-reports/summary` |
| `getReportRoster(groupId, date)` | `GET /small-groups/{id}/report-roster?date=` |
| `getSmallGroupReport(id)` | `GET /small-group-reports/{id}` (404 → `notFound()`) |
| `createSmallGroupReport(groupId, body)` | `POST /small-groups/{id}/reports` |
| `updateSmallGroupReport(id, body)` | `PATCH /small-group-reports/{id}` |
| `deleteSmallGroupReport(id)` | `DELETE /small-group-reports/{id}` |

Server actions in `app/(app)/groups/reports/_actions/report-actions.ts`, following
`groups/_actions/group-actions.ts`: create → redirect to the detail with `?saved=submitted`;
update → detail with `?saved=updated`; delete → list with `?saved=deleted` (the existing
`SavedToast` pattern). Revalidate the list, the detail, the group page and `/`.

Errors (`lib/api-error-message.ts`, matched on status + `detail`, never shown):

| Status | `detail` contains | Key | Where it shows |
| --- | --- | --- | --- |
| 409 | `already a report` | `ApiErrors.reportExists` | date field, with link to `existingReportId` |
| 409 | `Link your account to a member` | `ApiErrors.reportNeedsMember` | form alert (fallback; the button is disabled) |
| 409 | `closed` | existing closed-group key | form alert |
| 422 | `future` | `ApiErrors.reportFutureDate` | date field |
| 422 | `attendance` | `ApiErrors.reportRosterChanged` | form alert with **Reload people** (keeps answers for members still on the roster) |
| 422 | `didn't lead` | `ApiErrors.reportNotLeaderOnDate` | date field |

## Stage 1: API client, types, actions, errors

**Files:** `api/small-groups-api/{client,types}.ts`, `groups/reports/_actions/report-actions.ts`,
`groups/reports/_lib/` (zod schema for the body, draft storage helpers, `formatChurchSunday`),
`lib/api-error-message.ts`, `messages/*.json`.

- A `reportAccess(role, me)` helper beside `getSmallGroupAccess`: `{ access, canSubmit }` where
  `canSubmit = access !== "none" && me.member !== null` (rule 5).
- No UI yet.

## Stage 2: Reports list (`/groups/reports`)

**Boards:** `Reports`, `Reports-Leader`, `Reports-Unlinked`, `Reports-Empty`, `Reports-NoLink`,
`Reports-NoGroups-ES`, `Reports-Dark`, `Reports-Tablet`, `Reports-Phone`, and their dark/ES variants.

**Files:** `groups/reports/page.tsx`, `_components/reports-browser.tsx` (client: filters in the
URL search params), `reports-table.tsx`, `report-card.tsx`, `reports-list-skeleton.tsx`.

- `StaffAppPageHeader`: breadcrumbs Groups › Reports; title `ReportsPage.title` (full) or
  `ReportsPage.myTitle` (scoped); description to match. Action **New report** → `/groups/reports/new`.
  For a full role with no member: the disabled button plus the reason line below it
  (`aria-describedby`), as `Reports-Unlinked`.
- Filters (search params, so links and Back keep them): **Group** select (scoped: only their
  groups, plus "All my groups"; full: all groups, closed ones marked), **Meeting dates** range
  (default last 6 weeks), **Status** segmented control (`StatusTabs` pattern) All / Filed / Not
  filed with `counts`, **Search** (group, leader, note). Below `md`: search + a **Filters** button
  opening a sheet with group and dates; the status control stays visible.
- `dataTable()` from `md` up. Columns: Meeting (date), Group (+ `Closed` badge), At the meeting
  ("7 of 8"), At church, Submitted by, action. From `md` to `xl` (the 1024 board) Submitted by
  folds under the date ("By Carlos Mendoza" or a warning-coloured "Not filed").
  - Filed row: **Open** (`aria-label` "Open: {group}, {date}").
  - Not-filed row: warning tint, `—` in the counts, `Not filed` badge; **File report** (primary,
    small) only when the caller can submit, linking to `/groups/reports/new?groupId=&date=`.
- Below `md`: `card()` per item (`Reports-Phone`): date, group, status badge; filed cards show the
  two counts, "By …" and **Open**; not-filed cards show `ReportsList.missingNote` and a full-width
  **File report** when allowed. Pagination: table footer as Members; cards get **Show more**.
- Empty states (`EmptyState`):
  - full, no reports at all: `emptyTitle`/`emptyBody`, action **View groups**;
  - scoped, `getMe().member === null`: `notLinkedTitle`/`notLinkedBody`, no action;
  - scoped, leads nothing: `noGroupsTitle`/`noGroupsBody`, no action;
  - filters match nothing: `noMatchesTitle` with **Clear filters**.
- `?saved=deleted` → `SavedToast` "Report deleted".

## Stage 3: Report detail and delete (`/groups/reports/[id]`)

**Boards:** `ReportDetail`, `ReportDetail-Leader`, `ReportDetail-Submitted`, `ReportDetail-Delete`,
`ReportDetail-Closed`, `ReportDetail-Dark`, `ReportDetail-Tablet-ES`, `ReportDetail-Phone`,
`ReportDetail-Phone-Leader-Dark-ES`.

**Files:** `groups/reports/[id]/page.tsx`, `loading.tsx`, `_components/report-header.tsx`,
`report-summary-tiles.tsx`, `report-shared-card.tsx`, `report-attendance-card.tsx`,
`delete-report-dialog.tsx`.

- Header: breadcrumbs Reports › "{group}, {short date}"; eyebrow = group name (link to the group);
  title = long date ("Thursday, October 8, 2026"); line "Submitted by {name} · {date, time}".
  Actions: **Group page**; when `permissions.canEdit`: **Delete** (danger outline) and **Edit
  report** (primary). Full and scoped roles both get them (rule 4); closed groups don't (rule 8).
  On phones the actions share one row, full width.
- Closed group: a read-only note above the tiles (lock icon, `readOnlyTitle`/`readOnlyBody`) and
  a `Closed` badge next to the eyebrow.
- Three tiles (grid, auto-fit): At the group meeting ("7 of 8", "1 absent"), At church ("6 of 8",
  the church Sunday), Where they met (address, "The group's usual address" when it equals the
  group's `meetingAddress`, else nothing).
- "What the group shared" card: three sections (prayer, praise, for the elders to follow up), each
  with its icon; text in the testimony style; empty section says `nothingShared`.
- Attendance card: `dataTable()` with Member (avatar, name link, role or "Missed the last N
  meetings" in warning text, or "In the group since {date}" when they joined in the last 30 days),
  Group meeting badge, Church badge, and **Observation** column only when `observationsVisible`.
  Header line: lock icon + `obsPrivacy` when visible, `obsHidden` when not. `tfoot` totals row.
  Below `md`: a list of person blocks (name, two labelled badges, observation box when visible)
  and a totals strip.
- Delete: HeroUI alert dialog as `ConfirmDialog` (danger). Title/body from Copy; confirm
  **Delete report**; focus returns to **Delete** on cancel. On phones the dialog sits at the
  bottom with full-width buttons.
- `?saved=submitted|updated` → `SavedToast`.

## Stage 4: New report: meeting step (`/groups/reports/new`)

**Boards:** `ReportForm`, `ReportForm-DatePicker`, `ReportForm-Duplicate`, `ReportForm-Phone-Start`.

**Files:** `groups/reports/new/page.tsx` (server: groups the caller can submit for, `getMe()`),
`groups/reports/_components/report-flow.tsx` (client; holds the whole flow's state and the draft),
`meeting-step.tsx`, `meeting-date-picker.tsx`.

- Not allowed to submit (rule 5, or `none`) → `notFound()`. Scoped with no groups → redirect to
  the list (its empty state explains).
- Phone (below `md`): a focused task header replaces the top bar (close ✕ to the list, page title,
  group name, "2 / 4"); desktop keeps the shell with breadcrumbs, eyebrow = group name, and a
  4-step stepper (Meeting · People · The group · Review). The stepper is hidden on the meeting
  step and in quick-list mode.
- **Group**: select, preselected from `?groupId=`; only open groups the caller can submit for.
- **Meeting date**: a date field with a calendar popover (`ReportForm-DatePicker`): future days
  disabled, today ringed, the group's meeting weekday marked with a hollow gold dot, dates that
  already have a report with a filled success dot (from `listSmallGroupReports` for the visible
  month, `status=filed`). Default: the latest meeting-weekday date ≤ today without a report, else
  today. `?date=` (from **File report**) wins. Helper: `dateHint`.
- On every date or group change call `getReportRoster`. `existingReportId` → field error
  `ApiErrors.reportExists` + **Open that report**, the field `aria-invalid`, and the two mode
  cards dimmed and inert (`ReportForm-Duplicate`).
- **Where the group met**: text input, max 255, prefilled with the group's `meetingAddress`,
  helper `addressHint`.
- **How do you want to take attendance?**: two large option buttons (`guidedTitle`/`guidedBody`,
  `quickTitle`/`quickBody`), no default; picking one moves on. **Cancel** link clears the draft.

## Stage 5: One person at a time, the group, review

**Boards:** `ReportForm-Person`, `ReportForm-Person-Note`, `ReportForm-Group`, `ReportForm-Review`,
`ReportForm-Dark`, `ReportForm-Tablet-ES`, `ReportForm-Phone-Person`, `ReportForm-Phone-Person-Note`,
`ReportForm-Phone-Person-Dark-ES`.

**Files:** `person-step.tsx`, `yes-no-buttons.tsx`, `group-step.tsx`, `report-list-step.tsx`
(shared by review, quick list and edit).

- **Person step** (max width ~600px, centred column on desktop): "Person 4 of 8" and **Skip to the
  full list**; a segmented progress bar (done / current / to do). Card: 76px `InitialsAvatar`,
  name (display font), role `StatusBadge`, hint chip ("Missed the last 3 meetings" warning, or "In
  the group since Oct 1"). Two fieldsets, each a legend question and two 56px buttons
  (`aria-pressed`): "Yes, came" / "No", "Yes, was there" / "No". Note: a dashed **Add a note about
  {name}** button that expands to a textarea (max 1024) with the lock line `notePrivacy`. Footer:
  **Back** (previous person, or the meeting step) and **Next person** / **Continue** on the last;
  disabled until both answered, with `answerBoth` below. Focus moves to the new person's name on
  each step.
- **The group step**: three textareas (max 1024, counters "0 / 1024"), each with a hint; intro
  line says anyone who can see the report can read them. **Back** / **Review report**.
- **Review**: summary strip (date, address, **Change** back to the meeting step), then the list
  step (Stage 6) with **Back** and **Submit report**. Rows not yet answered get the warning tint;
  the footer hint counts them ("Mark the 2 remaining people to submit."). Submitting builds the
  body from the roster order; on success the draft is cleared.

## Stage 6: Quick list and edit (`/groups/reports/[id]/edit`)

**Boards:** `ReportForm-Quick`, `ReportForm-Edit`, `ReportForm-Phone-Quick`.

- **List step** (used by quick list, review and edit): card "Attendance" with "5 of 8 marked".
  From `md`: header row Member · Group meeting · Church, {Sun date} · Note; each row avatar + name
  + sub line, two compact Yes/No pairs (44px), and a note toggle (**Add note** / **Note** when one
  exists, **Hide** when open) that opens the textarea under the row. Below `md`: each row is a
  block (name, then the two labelled pairs side by side, then the note toggle). Then the three
  group textareas in a grid (one column on phones). Footer: hint + primary action, full width on
  phones.
- **Quick list**: reached from the meeting step; no stepper; **Back** returns to the meeting step.
- **Edit**: server page loads the report and its roster; a "meeting details" card with the date
  (same picker and duplicate check, rule 1 ignores the report itself) and address, and the line
  `editMeta` (submitter and time, which won't change). Observations: when `observationsVisible`
  is false, the note column and note toggles are not rendered at all and nothing is sent (the API
  keeps them, rule 9). Actions **Cancel** (to the detail) and **Save changes**.
- If the roster for the date differs from the report's rows (someone joined or left), use the
  roster and keep answers for members present in both; new people start unanswered.

## Stage 7: Entry points

**Boards:** `GroupDetail`, `GroupDetail-Closed` (page "Small groups"), `LeaderDashboard`,
`LeaderDashboard-Dark-ES`, `LeaderDashboard-Tablet`, `LeaderDashboard-NoLink`, `LeaderDashboard-Phone`.

- **Group detail, "Recent meetings" card** (right column, under When & where): eyebrow Reports,
  **View all** (to the list filtered by this group), the last 4 items from
  `listSmallGroupReports({ smallGroupId, pageSize: 4 })` (date, "7 of 8 at the meeting · 6 at
  church" or "The group met; no report was filed", status badge, link), then **New report**
  (`?groupId=`) when the caller can submit and the group is open. Closed: no button, line
  `GroupReportsCard.closedNote`. No reports at all: one muted line `noneYet`.
- **Leader dashboard** (`/` for scoped roles, replacing nothing they see today): greeting as the
  current dashboard, then **My groups**: a `card()` per group from `getSmallGroupReportSummary()`:
  name (link), role badge, "Meets Thursdays", a **Meets today** badge when the meeting weekday is
  today, **Last report** (date link + "7 of 8 at the meeting · by Carlos Mendoza", or `noReportYet`),
  a warning strip for each not-filed date with **File it**, and footer **New report** + **Open
  group**. **View my reports** link in the section header. Empty: the not-linked / no-groups
  `EmptyState` copy from the list. Full roles' dashboard is unchanged.

## Stage 8: Review pass

Run the checklist signed in as: an `admin` linked to a member; an `elder` not linked; a
`smallGroupLeader` who leads one group and co-leads another (and led a group that was closed); a
`deacon` with no member; a `user`. Seed data has eight weeks of reports per group.

## Copy

All new UI text, both languages (*tú*, *grupo pequeño*, no gendered pronouns). Dates through
`lib/format-date.ts` with the current locale. Reconcile with existing keys (role names from
`SmallGroupRole`, weekdays from the groups pages) instead of duplicating. The `ReportsPage`
empty-state keys of the stub are replaced.

| Namespace.key | English | Español |
| --- | --- | --- |
| `ReportsPage.title` | Small group reports | Reportes de grupos pequeños |
| `ReportsPage.description` | One report per meeting, filed by each group’s leaders. Past meetings without a report show as Not filed. | Un reporte por reunión, enviado por quienes lideran cada grupo. Las reuniones pasadas sin reporte aparecen como No enviado. |
| `ReportsPage.myTitle` | My reports | Mis reportes |
| `ReportsPage.myDescription` | Reports for the groups you lead or co-lead. One per meeting, filed after the group meets. | Reportes de los grupos que lideras o colideras. Uno por reunión, enviado después de que el grupo se reúne. |
| `ReportsPage.newReport` | New report | Nuevo reporte |
| `ReportsPage.linkReason` | Link your account to a member to submit reports. An admin or elder can do it from Users. | Vincula tu cuenta a un miembro para enviar reportes. Un administrador o anciano puede hacerlo desde Usuarios. |
| `ReportsPage.emptyTitle` | No reports yet | Aún no hay reportes |
| `ReportsPage.emptyBody` | Reports show up here once each group’s leaders file them after a meeting. | Los reportes aparecen aquí cuando quienes lideran cada grupo los envían después de una reunión. |
| `ReportsPage.viewGroups` | View groups | Ver grupos |
| `ReportsPage.notLinkedTitle` | Your account isn’t linked to a member yet | Tu cuenta aún no está vinculada a un miembro |
| `ReportsPage.notLinkedBody` | Reports are filed by the people who lead or co-lead a small group. Ask an admin or elder to link your account to your member profile, and your groups will show up here. | Los reportes los envían quienes lideran o colideran un grupo pequeño. Pide a un administrador o anciano que vincule tu cuenta con tu perfil de miembro y tus grupos aparecerán aquí. |
| `ReportsPage.noGroupsTitle` | You don’t lead a small group yet | Aún no lideras un grupo pequeño |
| `ReportsPage.noGroupsBody` | Reports are filed by a group’s leader and co-leaders. Once you’re added as one, your group and its reports will show up here. | Los reportes los envían quienes lideran o colideran un grupo. Cuando te agreguen como líder o colíder, tu grupo y sus reportes aparecerán aquí. |
| `ReportsPage.noMatchesTitle` | No reports match these filters | Ningún reporte coincide con estos filtros |
| `ReportsPage.clearFilters` | Clear filters | Quitar filtros |
| `ReportsList.group` / `allGroups` / `allMyGroups` | Group / All groups / All my groups | Grupo / Todos los grupos / Todos mis grupos |
| `ReportsList.dates` | Meeting dates | Fechas de reunión |
| `ReportsList.status` / `all` / `filed` / `notFiled` | Report status / All / Filed / Not filed | Estado del reporte / Todos / Enviado / No enviado |
| `ReportsList.search` / `searchPlaceholder` / `filters` | Search reports / Group, leader or note / Filters | Buscar reportes / Grupo, líder o nota / Filtros |
| `ReportsList.colMeeting` / `colGroup` / `colAttended` / `colChurch` / `colBy` | Meeting / Group / At the meeting / At church / Submitted by | Reunión / Grupo / En la reunión / En la iglesia / Enviado por |
| `ReportsList.countOf` | {count} of {total} | {count} de {total} |
| `ReportsList.by` | By {name} | Por {name} |
| `ReportsList.open` / `openLabel` | Open / Open: {group}, {date} | Abrir / Abrir: {group}, {date} |
| `ReportsList.fileReport` | File report | Enviar reporte |
| `ReportsList.missingNote` | This group met but no report was filed. | El grupo se reunió, pero no se envió reporte. |
| `ReportsList.atMeeting` / `atChurch` | at the meeting / at church | en la reunión / en la iglesia |
| `ReportsList.showMore` | Show more | Ver más |
| `ReportsList.deleted` | Report deleted | Reporte eliminado |
| `ReportDetail.groupPage` / `edit` / `delete` | Group page / Edit report / Delete | Página del grupo / Editar reporte / Eliminar |
| `ReportDetail.submittedBy` | Submitted by {name} · {dateTime} | Enviado por {name} · {dateTime} |
| `ReportDetail.groupClosed` | Group closed | Grupo cerrado |
| `ReportDetail.readOnlyTitle` | Read-only | Solo lectura |
| `ReportDetail.readOnlyBody` | {group} closed on {date}. Its reports can be viewed but not changed or deleted, and no new ones can be added. | {group} se cerró el {date}. Sus reportes se pueden ver, pero no cambiar ni eliminar, y no se pueden agregar nuevos. |
| `ReportDetail.tileMeeting` / `tileAbsent` | At the group meeting / {count, plural, one {# absent} other {# absent}} | En la reunión del grupo / {count, plural, one {# no asistió} other {# no asistieron}} |
| `ReportDetail.tileChurch` / `tileWhere` / `usualAddress` | At church / Where they met / The group’s usual address | En la iglesia / Dónde se reunieron / Dirección habitual del grupo |
| `ReportDetail.fromGroup` / `sharedTitle` / `nothingShared` | From the group / What the group shared / Nothing shared this week. | Del grupo / Lo que compartió el grupo / No se compartió nada esta semana. |
| `ReportDetail.prayer` / `praise` / `discussion` | Prayer requests / Praise / For the elders to follow up | Peticiones de oración / Motivos de alabanza / Para seguimiento de los ancianos |
| `ReportDetail.people` / `attendance` / `member` | People / Attendance / Member | Personas / Asistencia / Miembro |
| `ReportDetail.colMeeting` / `colChurch` / `observation` / `totals` | Group meeting / Church, {sunday} / Observation / Totals | Reunión del grupo / Iglesia, {sunday} / Observación / Totales |
| `ReportDetail.attended` / `absent` / `atChurch` / `notAtChurch` | Attended / Absent / At church / Not at church | Asistió / No asistió / En la iglesia / No fue a la iglesia |
| `ReportDetail.missedStreak` | Missed the last {count} meetings | Faltó a las últimas {count} reuniones |
| `ReportDetail.joinedSince` | In the group since {date} | En el grupo desde el {date} |
| `ReportDetail.obsPrivacy` | Observations are seen only by admins, elders and the person who wrote them. | Las observaciones solo las ven administradores, ancianos y quien las escribió. |
| `ReportDetail.obsHidden` | Observations on this report are seen only by admins, elders and the person who wrote them. | Las observaciones de este reporte solo las ven administradores, ancianos y quien las escribió. |
| `ReportDetail.obsCount` | {count, plural, one {# observation} other {# observations}} | {count, plural, one {# observación} other {# observaciones}} |
| `ReportDetail.deleteTitle` | Delete this report? | ¿Eliminar este reporte? |
| `ReportDetail.deleteBody` | The report for {group} on {date}, with its attendance and observations, will be removed. This can’t be undone. | Se eliminará el reporte de {group} del {date}, con su asistencia y observaciones. Esta acción no se puede deshacer. |
| `ReportDetail.deleteConfirm` | Delete report | Eliminar reporte |
| `ReportDetail.submitted` / `updated` | Report submitted / Changes saved | Reporte enviado / Cambios guardados |
| `ReportForm.newTitle` / `editTitle` / `reviewTitle` | New report / Edit report / Review and submit | Nuevo reporte / Editar reporte / Revisar y enviar |
| `ReportForm.steps` | Meeting · People · The group · Review (four keys) | Reunión · Personas · El grupo · Revisar |
| `ReportForm.meetingTitle` / `group` / `groupHint` | The meeting / Group / You lead or co-lead these groups. | La reunión / Grupo / Lideras o colideras estos grupos. |
| `ReportForm.date` / `dateHint` | Meeting date / Today or an earlier date. {group} meets on {weekday}. | Fecha de la reunión / Hoy o una fecha anterior. {group} se reúne los {weekday}. |
| `ReportForm.legendMeets` / `legendFiled` | Meeting day / Report filed | Día de reunión / Reporte enviado |
| `ReportForm.openExisting` | Open that report | Abrir ese reporte |
| `ReportForm.address` / `addressHint` / `optional` | Where the group met / The group’s usual address. Change it if you met somewhere else this time. / (optional) | Dónde se reunió el grupo / La dirección habitual del grupo. Cámbiala si esta vez se reunieron en otro lugar. / (opcional) |
| `ReportForm.howTitle` / `howSub` | How do you want to take attendance? / You’ll see everyone on one list before you submit either way. | ¿Cómo quieres tomar la asistencia? / De cualquier forma, verás a todas las personas en una lista antes de enviar. |
| `ReportForm.guidedTitle` / `guidedBody` | One person at a time / Think through each person: the meeting, church on Sunday, and a note if something needs care. | Una persona a la vez / Piensa en cada persona: la reunión, la iglesia el domingo y una nota si algo necesita atención. |
| `ReportForm.quickTitle` / `quickBody` | Quick list / Everyone on one screen. Mark attendance and add notes where you need them. | Lista rápida / Todas las personas en una pantalla. Marca la asistencia y agrega notas donde haga falta. |
| `ReportForm.personCount` / `skipToList` | Person {n} of {total} / Skip to the full list | Persona {n} de {total} / Ir a la lista completa |
| `ReportForm.q1` | Did {name} come to the meeting? | ¿{name} vino a la reunión? |
| `ReportForm.q2` | Was {name} at church on {sunday}? | ¿{name} estuvo en la iglesia el {sunday}? |
| `ReportForm.yesCame` / `yesChurch` / `no` | Yes, came / Yes, was there / No | Sí, vino / Sí, estuvo / No |
| `ReportForm.addNote` / `noteLabel` / `notePrivacy` | Add a note about {name} / Note about {name} / Only you, the elders and admins can see this. | Agregar una nota sobre {name} / Nota sobre {name} / Solo tú, los ancianos y los administradores pueden verla. |
| `ReportForm.back` / `nextPerson` / `continue` / `answerBoth` | Back / Next person / Continue / Answer both questions to continue. | Atrás / Siguiente persona / Continuar / Responde ambas preguntas para continuar. |
| `ReportForm.groupEyebrow` / `groupSub` | The group as a whole / Anyone who can see this report can read these three sections. | El grupo en general / Cualquier persona que pueda ver este reporte puede leer estas tres secciones. |
| `ReportForm.prayerHint` / `praiseHint` / `discussionHint` | What the group asked to pray for. / What the group is thankful for. / Points from the conversation the elders may want to follow up on. | Por qué pidió orar el grupo. / Por qué está agradecido el grupo. / Temas de la conversación a los que los ancianos podrían dar seguimiento. |
| `ReportForm.counter` | {count} / 1024 | {count} / 1024 |
| `ReportForm.toReview` / `change` | Review report / Change | Revisar reporte / Cambiar |
| `ReportForm.marked` | {count} of {total} marked | {count} de {total} marcadas |
| `ReportForm.addNoteShort` / `noteShort` / `hideNote` | Add note / Note / Hide | Agregar nota / Nota / Ocultar |
| `ReportForm.remaining` | {count, plural, one {Mark the # remaining person to submit.} other {Mark the # remaining people to submit.}} | {count, plural, one {Marca a la # persona que falta para enviar.} other {Marca a las # personas que faltan para enviar.}} |
| `ReportForm.allMarked` | Everyone is marked. Notes are seen only by you, the elders and admins. | Todas las personas están marcadas. Las notas solo las ven tú, los ancianos y los administradores. |
| `ReportForm.submit` / `save` / `cancel` | Submit report / Save changes / Cancel | Enviar reporte / Guardar cambios / Cancelar |
| `ReportForm.editMeta` | Submitted by {name} on {dateTime}. Your changes keep the original submitter. | Enviado por {name} el {dateTime}. Tus cambios conservan a quien lo envió. |
| `GroupReportsCard.eyebrow` / `title` / `viewAll` | Reports / Recent meetings / View all | Reportes / Reuniones recientes / Ver todos |
| `GroupReportsCard.counts` | {attended} of {total} at the meeting · {church} at church | {attended} de {total} en la reunión · {church} en la iglesia |
| `GroupReportsCard.missing` / `closedNote` / `noneYet` | The group met; no report was filed / This group is closed, so its reports are read-only. / No reports yet. | El grupo se reunió; no se envió reporte / Este grupo está cerrado, así que sus reportes son de solo lectura. / Aún no hay reportes. |
| `LeaderDashboard.myGroups` / `viewMyReports` / `meetsToday` | My groups / View my reports / Meets today | Mis grupos / Ver mis reportes / Se reúne hoy |
| `LeaderDashboard.lastReport` / `lastReportLine` / `noReportYet` | Last report / {attended} of {total} at the meeting · by {name} / No reports yet | Último reporte / {attended} de {total} en la reunión · por {name} / Aún no hay reportes |
| `LeaderDashboard.notFiled` / `fileIt` / `openGroup` | {date}: the group met but no report was filed. / File it / Open group | {date}: el grupo se reunió, pero no se envió reporte. / Enviarlo / Abrir grupo |
| `ApiErrors.reportExists` | There’s already a report for {date}. | Ya hay un reporte para el {date}. |
| `ApiErrors.reportNeedsMember` | Link your account to a member to submit reports. | Vincula tu cuenta a un miembro para enviar reportes. |
| `ApiErrors.reportFutureDate` | The meeting date can’t be in the future. | La fecha de la reunión no puede ser futura. |
| `ApiErrors.reportRosterChanged` | The group’s members changed. Reload the list to continue. | Cambiaron los miembros del grupo. Vuelve a cargar la lista para continuar. |
| `ApiErrors.reportNotLeaderOnDate` | You didn’t lead this group on that date. | No liderabas este grupo en esa fecha. |
| `ApiErrors.reloadPeople` | Reload people | Volver a cargar personas |

## Not in this spec

- Reminders or notifications for not-filed reports; exports and charts.
- Uploaded member photos (initials avatar for now, same circle later).
- A server-side draft.
- A leader dashboard section for full roles (their dashboard is unchanged).
- Spanish previews on the older canvas boards (Group detail and others are drawn in English only).

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; the list and the attendance
      table switch to cards below `md`; the person card's buttons stay 56px and the list's 44px.
- [ ] Observations: admins and elders see them; the submitter sees their own; another leader of
      the group, a deacon and a co-leader editing someone else's report never do (check the network
      response too, not just the UI).
- [ ] Unlinked admin/elder: **New report** disabled with the reason; the dashboard and Group
      detail don't offer New report.
- [ ] Closed group: report detail read-only, no Edit/Delete, no New report on its card.
- [ ] Duplicate date caught on the date step; future dates not selectable; Submit disabled until
      everyone is marked; the draft survives a reload and is cleared after submit.
- [ ] Focus: each person step lands on the name; dialogs return focus to their trigger.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean);
      `messages/parity.ts` passes.
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
