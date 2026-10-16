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
| 2. Reports list (`/groups/reports`) | ✅ | 6a5d945 |
| 3. Report detail and delete | ✅ | 827d6c8 |
| 4. New report: meeting step | ✅ | 023535d |
| 5. New report: one person at a time, the group, review | ✅ | eb4b771 |
| 6. Quick list and edit | ✅ | 1167992 |
| 7. Entry points: Group detail card, leader dashboard | ✅ | c208906 |
| 8. Review pass | ✅ (elder and board comparison open, see below) | see `git log` |

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
- **Stage 3: testimony style is not a utility.** Added `testimony()` (a `tv` helper) to
  `components/primitives.ts`: Newsreader italic 17px, no new Tailwind utility.
- **Stage 3: "In the group since" is derived.** The report's attendance rows carry no join date, so
  the page also reads the group (`getSmallGroup`) and uses the active membership's `joinedAt` when it
  is within 30 days before the meeting. Closed groups (no active members) and failed reads show the
  role instead. Worth adding `joinedAt` to the API rows if exactness matters.
- **Stage 3: member name links are for full roles only** (scoped roles don't have member pages).
- **Stage 3: timestamps in the church time zone.** "Submitted by … · {dateTime}" is formatted on the
  server with `CHURCH_TIMEZONE` (`formatChurchDateTime`), so it matches for everyone.
- **Stage 3: the attendance table is a client component** (`report-attendance-table.tsx`): HeroUI's
  `Table` rendered straight from a server component caused a hydration mismatch.
- **Stage 3: extra key** `ReportDetail.noAddress`, `ofTotal`. The delete dialog gets its text as props.
- Verified (Stage 3): admin on a real report, Spanish dark at 1440 and a 390 frame (no sideways
  scroll, person blocks), delete dialog opens, Escape returns focus to **Eliminar**; no console
  errors after the table fix. Delete was **not** confirmed against real data. Not yet seen: closed
  group, observations on a report that has them, leader/deacon views (Stage 8).
- **Stage 4: the mode cards stop here.** Picking *One person at a time* or *Quick list* records the
  mode (and saves the draft) but nothing follows until Stages 5 and 6; nothing is stubbed. `ReportFlow`
  holds the group, date, address, mode and roster, so later steps hang off the same state.
- **Stage 4: filed-date dots look back 400 days, once per group**, not per visible month
  (`listFiledDatesAction`, one call of up to 100 reports). Older months show no filled dot; the
  roster's `existingReportId` still blocks a duplicate on any date. The same set feeds the default date.
- **Stage 4: the date step's duplicate message comes from the server.** `getReportRosterAction` now
  returns `existsMessage` (`ApiErrors.reportExists`) so `ApiErrors` stays out of the client bundle.
- **Stage 4: draft is written on edit, not on mount.** Address edits and picking a mode save
  `ekk-report-draft:{group}:{date}` (merged over any existing draft, so later stages' fields survive);
  Cancel and the phone ✕ clear it. A restored draft's address wins over the group's.
- **Stage 4: phone task header is a `fixed` bar over the shell's top bar** (`md:hidden`, `z-40`), not a
  shell change. Its "1 / 4" is always 1 on this step. The desktop stepper isn't built: it is hidden on
  the meeting step anyway and arrives with Stage 5.
- **Stage 4: `?date=` and `?groupId=`** are validated on the server (future or malformed dates and
  groups the caller can't submit for are ignored). A group switch fetches the new group's filed dates
  first, then switches group and date together, so there is one roster call, not two.
- **Stage 4: extra keys** `ReportForm.meetingEyebrow`, `stepCount`, `close`, `groupHintFull`,
  `dateHintNoDay`, `calendarLabel`, `rosterLoading`, `noPeople`, `stepsLabel`. Spanish `dateHint` has no
  "los" of its own: the weekday comes from `Weekdays.sentence` ("los miércoles").
- Verified (Stage 4), signed in as sgla-leader: light/dark, EN/ES, 1440, 1024 and a 390 frame (no
  sideways scroll, task header shown only below `md`). Group select lists only Alpha and Beta. Default
  date for Alpha is Sep 21 (latest Monday without a report); the calendar shows hollow and filled dots;
  picking Sep 28 (filed) shows the error with **Open that report** and dims the cards; draft restores
  after reload; Cancel clears it; no console errors. Not seen: a not-linked or unsubmittable caller
  (404, Stage 8), a failing roster call, the date picker's keyboard flow.
- **Stage 5: the list step is built here, not in Stage 6.** Review *is* the list step (attendance
  table, the three group textareas, footer), and Submit lives on it, so `report-list-step.tsx` and
  `group-fields.tsx` arrive now. Stage 6 only wires **Quick list** to it and adds the edit page.
  **Quick list** still does nothing when picked (as the mode cards did in Stage 4).
- **Stage 5: the person step is left-aligned**, like the board and every page in the app, not centred as
  the spec's "centred column" says. Width 640px; the list step is 1000px.
- **Stage 5: draft = one object behind a ref.** `ReportFlow` keeps the draft in state and in a ref
  (`draftRef`); every edit writes both and `localStorage`. Without the ref, two taps in the same frame
  overwrote each other (seen while testing). On a group or date change the draft for that pair is
  restored, else the current one is kept when only the date changed, else a fresh one for the new group.
- **Stage 5: submit clears the draft first** and puts it back on failure, because a successful action
  redirects and never returns to the client. Date failures (`exists`, `future`, `notLeaderOnDate`)
  send the leader back to the meeting step with the message on the date field; `rosterChanged` shows
  the alert with **Reload people** (answers stay keyed by member id, so people still on the roster keep
  theirs); `needsMember` and `closed` show the alert on the review.
- **Stage 5: guided mode resumes at the first unanswered person** (a restored draft doesn't start over).
- **Stage 5: column titles use a short Sunday** ("Sun, Oct 11", new `formatCalendarShortWeekdayDate`);
  the question keeps the long one ("Sunday, Oct 11").
- **Stage 5: extra keys** `groupTitle`, `attendanceEyebrow`, `attendanceTitle`, `colMember`, `colNote`,
  `yes`, `missedStreak`, `joinedSince`, `reloadPeople` (the latter three duplicate server-side keys
  because the flow is client-only and refetches the roster).
- **Stage 5: not-answered tint** (`warning-soft`) shows on every row of the review, including when
  someone skips straight to it with nobody answered.
- Verified (Stage 5), as sgla-leader: guided flow on Alpha (3 people) end to end, **submitted report
  163** (SGLA Alpha, Sep 21: one note, a prayer text): detail shows the answers, the note to its
  submitter, the draft is gone, no console errors. Person step dark 1440 EN and light 390 ES (56px
  buttons, no sideways scroll); review dark 1440 EN, light 390 ES (44px pairs, stacked rows) and light
  1024 ES (stepper beside the title). Note count in the fetched detail HTML for the submitter: 4
  (table plus flight payload); leak checks for other roles stay in Stage 8. Hit the API's own rate
  limit (60/min per user, 429 on `/me`) after many reloads: not a bug in the page, but the new report
  page makes roughly six API calls per load.
- **Stage 6: Quick list follows the board, not a stepper.** No summary strip, no unanswered tint and no
  `n / 4` on the phone header; the footer keeps **Back** (spec text) which returns to the meeting step,
  though the board draws only the hint and **Submit report**. Both modes end on the same
  `ReportListStep`.
- **Stage 6: edit is its own form** (`EditReportForm`), not `ReportFlow`: no draft (the spec keeps drafts
  for new reports), no steps. It starts from the report's rows, refetches the roster when the date
  changes and keeps answers for people on both rosters; new people start unanswered and block **Save
  changes**. A date that belongs to another report shows the duplicate error (the report's own date is
  fine, rule 1). Shared with the new flow: `toReportInput` (`_lib/report-body.ts`), `DateProblemNote`,
  `ReportFooterStatus`.
- **Stage 6: hidden observations.** With `observationsVisible` false the edit page renders no note
  column or toggles, the grid drops the empty column, and `observation` is left out of every row so the
  API keeps the notes. A closed group's edit URL redirects to the report (read-only note shown).
- **Stage 6: edit breadcrumbs** are Groups › Reports › "{group}, {date}" › Edit report (the board has
  only Reports › Edit report); the extra crumb links back to the report.
- Verified (Stage 6): leader (sgla-leader) filed **report 164** (Beta, Sep 23) through the quick list;
  edited report 163 (own) and saved; opened **152** (submitted by someone else) in edit: **0** notes in
  its edit and detail HTML (151, the leader's own, has 4 and 8), saved it, then as sgla-admin the notes on
  152 are all still there (8 in detail, 4 in edit). As the unlinked admin `/groups/reports/new` is the 404
  page and a closed group's edit (report 160) redirects to its detail. Layout: edit at 390 (light, ES; no
  sideways scroll) and 1024 (dark, ES); quick list light 1440 ES; the review states from Stage 5 cover the
  list at 390 and 1024. Not seen: quick list at 390/EN, edit in EN, a failing save (rosterChanged).
  Test data added: reports 163 and 164, and 152 re-saved (same content).
- **Stage 7: the leader dashboard replaces the regular one for scoped roles.** The board shows only the
  greeting, a new description (`LeaderDashboard.description`) and **My groups**, with no application tiles,
  recent applications or **Add member**, so that is what leaders and deacons get at `/`. The spec line
  "replacing nothing they see today" can be read the other way (keep the old content and add My groups);
  say so if the application tiles should stay for them. Full roles' dashboard is untouched.
- **Stage 7: closed groups are left out of My groups** (the summary can include them); a leader whose
  only group closed gets the "You don't lead a small group yet" state. Cards are `max-w` 1000px, auto-fill
  340px columns. The not-linked and no-groups empty states are capped at 640px like the board.
- **Stage 7: Group detail card** is a server component that reads `listSmallGroupReports({ smallGroupId,
  pageSize: 4 })` itself; a failed read says so in the card. Each row links to its report; a not-filed row
  links to filing it (`?groupId=&date=`) only when the caller can submit and the group is open.
  `getMe()` is now called for full roles too (it is `cache()`d), for `canSubmit`.
- **Stage 7: "View all"** goes to `/groups/reports?groupId=`, the list's existing group filter.
- Verified (Stage 7): sgla-admin (unlinked): Group detail card with four rows, **no New report**;
  sgla-leader: dashboard (two cards, role badges, last report, not-filed strip with **File it** after
  deleting test report 164), Group detail with the card and **New report**; sgla-deacon (unlinked): the
  not-linked state. **Delete was confirmed for the first time**: dialog, toast "Reporte eliminado" and the
  list shows Beta Sep 23 as not filed again. Layout: dashboard and Group detail in EN light at 390 and 1024
  (no sideways scroll), ES dark at 1440; quick list at 390 EN (also closes the Stage 6 gap).
  **Not verified:** the **Meets today** badge (no SGLA group meets on a Thursday; today in the church time
  zone was Thu Oct 15), a linked admin or elder's New report on the card and dashboard, the closed-group
  card variant (`closedNote`), and the dashboard at 1440 in EN or light.

- **Stage 8: review pass, what was run** (accounts: sgla-leader, sgla-deacon, sgla-user, sgla-admin
  unlinked and, temporarily, linked to member 107 via `PUT /members/107/user`, unlinked again after).
  - **One bug found and fixed:** the meeting date calendar (and the list's range calendar) let a future
    day be picked: `maxValue` was only on the picker, not on the calendar inside it, so Arrow keys and
    clicks reached tomorrow and the field turned invalid. `maxValue` is now on `Calendar` and
    `RangeCalendar`; retested by keyboard (ArrowRight stops at today) and Escape returns focus to the
    calendar button.
  - **Observation privacy** (note text counted in the API JSON and in the fetched detail and edit
    HTML, plus the list, dashboard, group pages and summary): admin sees all notes (2 in the API,
    8 in detail HTML, 4 in edit); the leader sees them only on reports they submitted (151, 153, 155)
    and **0** on 152, 154, 156, which covers another leader of the group and the co-leader on Beta;
    deacon (404 from the API) and user (403) get **0** everywhere.
  - **Meets today** badge: seen (Alpha moved to Thursday, reverted to Monday afterwards).
  - **Linked admin:** Group detail shows **New report** (also a per-row one for the not-filed date);
    the dashboard has none, because a full role's dashboard is unchanged. **Unlinked admin:** list has
    the disabled **New report** with its reason, `/groups/reports/new` is the 404 page, Group detail
    has no **New report**.
  - **Closed group (Delta, as leader):** Group detail card with `closedNote` and no button; report 160
    read-only (no Edit/Delete), its `/edit` redirects to the detail.
  - **Failing save:** added a member to Alpha as admin while a quick list for today was filled in;
    submit showed the alert with **Volver a cargar personas**; reloading kept the three answers, added
    the new person unanswered and disabled Submit (3 of 4).
  - **Date picker keyboard:** segments take Arrow keys; a future day is flagged "can't be future"
    (field) and, after the fix, unreachable in the calendar; Tab reaches the calendar button, Enter
    opens it.
  - **Phone list:** Filters sheet (group, date range, **Listo**) opens and closes; **Show more** loads
    the rest (44 rows) with no sideways scroll at 390.
  - **Layout sweep** (iframe trick, programmatic check for sideways overflow, theme applied, error
    pages): leader on dashboard, list, report detail, edit, new report, Group detail, closed Group
    detail and closed report × light/dark × 1440/1024/390 × English/Spanish, all clean; admin on
    dashboard, list, detail, edit and Group detail × light/dark × 3 widths in Spanish, all clean.
  - **Elder** (sgla-user set to `elder` with `admin/set-role`, then restored to `user`): unlinked, it
    sees the notes on every report (API and HTML), the list's disabled **New report** with its reason,
    no New report on Group detail; linked to member 108 (unlinked again afterwards) it gets New report
    on the list and Group detail, the report form loads, and detail shows Edit, Delete and the notes.
  - **Not done:** the comparison against the canvas boards (the user does it from Claude desktop) (not opened this session); measured button heights (56/44px), the
    person step's focus on the name, the gold-text rule, and admin/deacon/user pages in English.
  - **Test data left behind:** Test Deacon (member 106) has a closed membership row in Alpha (joined
    and left on 2026-10-15). No reports were added this session.
  - **For the user to decide (not changed):** (1) scoped roles lost the application tiles on `/` because
    the board shows only My groups; (2) Quick list keeps its **Back** button although its board has none.
  - Also seen, outside this feature: a plain `user` still gets the full dashboard (Add member,
    applications) at `/`, and the Members and Applications nav items.

## Pick-up notes (written at the end of session 1; read before Stage 4)

**State (stale; stages 1–8 are done, see the table):** the notes below were written for Stage 4.
Setup facts (accounts, ids, gotchas) still hold; the starter prompt at the end is obsolete. The
branch is **not** pushed or merged. Nothing is stubbed; every call goes to the real API on
`localhost:8000` (`APPLICATIONS_MEMBERSHIP_API_URL`), whose report routes are on its `main`.
Added in Stage 8: the harness trick for sweeps is a script in the page that appends an iframe per
combination and measures `scrollWidth`; the locale cookie can't be set with `document.cookie` (it is
set by the server), so switch language once through the account menu. `PUT/DELETE /members/{id}/user`
(body `{"userId": ...}`) links and unlinks; a roster change that affects *today's* report needs a
member added to the group today (`POST /small-groups/{id}/members`) and the report dated today.

### What already exists (reuse, don't rebuild)

- `api/small-groups-api/{client,types}.ts`: `getReportRoster`, `createSmallGroupReport`,
  `updateSmallGroupReport`, `listSmallGroupReports`, `getSmallGroupReportSummary`, and the types
  (`ReportRoster`, `ReportInput`, `ReportDetail`, ...). People are `{ memberId, name }` (one `name`).
- `groups/reports/_actions/report-actions.ts`: `getReportRosterAction(groupId, date)` (the date
  step calls it on every date/group change), `createReportAction(groupId, input)` and
  `updateReportAction(id, groupId, input)` (both redirect on success, return a `ReportFailure` with
  `kind` and `existingReportId`), `deleteReportAction`, `listReportsPageAction`.
- `groups/reports/_lib/`: `report-schema.ts` (body schema, `ADDRESS_MAX`/`TEXT_MAX`),
  `report-draft.ts` (`loadDraft`/`saveDraft`/`clearDraft`, key `ekk-report-draft:{groupId}:{date}`),
  `format-church-sunday.ts` ("Sunday, Oct 11"), `report-filters.ts`, `load-report.ts` (`loadReport`,
  use it for the edit page).
- `lib/auth/roles.ts` `reportAccess(role, me)` → `{ access, canSubmit }`; `lib/church-time.ts`
  `getChurchToday()` (server) for "today" (needed for the date picker's future-days rule and the
  default date); `lib/api-error-message.ts` maps every report error (`getReportErrorKind`).
- The list's **File report** links already point at `/groups/reports/new?groupId=&date=`
  (`fileReportHref` in `reports-table.tsx`); `NewReportLink` already links `/groups/reports/new`.
- Messages: `ReportsPage`, `ReportsList` (client namespace), `ReportDetail`, and `ApiErrors.report*`
  / `groupClosed` / `reloadPeople` are in. **`ReportForm`, `GroupReportsCard`, `LeaderDashboard`
  are not**: take them from the Copy table below. Use `{count, number}`-style ICU for numeric
  arguments (a bare `{count}` is typed `string`), and `ReportForm.q1`/`q2`/`addNote`/`noteLabel`
  take `name` = the person's **first word**, `sunday` = `formatChurchSunday(...)`.
- HeroUI v3.2.4 date pieces are available and `@internationalized/date` is a direct dependency:
  `DatePicker` / `DateRangePicker` + `DateField.Group/Input/Segment/Suffix`, `Calendar` /
  `RangeCalendar` with `Header`, `YearPickerTrigger(+Heading,+Indicator)`, `NavButton slot=...`,
  `Grid`, `GridHeader`, `GridBody`, `Cell`, `CellIndicator`, `YearPickerGrid(+Body, +Cell)`. See
  `reports-browser.tsx` for a working range picker. The Stage 4 picker needs per-day decoration
  (hollow gold dot on the meeting weekday, filled success dot where a report exists, today ringed,
  future days disabled via `maxValue`/`isDateUnavailable`): render it inside `Calendar.Cell`.

### Gotchas learned (save yourself the time)

- **HeroUI `Table` must live in a client component.** Rendering it from a server component caused a
  hydration mismatch (6 console errors); `report-attendance-table.tsx` shows the pattern (server
  translates, client renders, labels passed as props).
- **Narrow viewports:** the Chrome window can't go below ~2000px here. Test 1024/390 by replacing
  the page with a same-origin iframe: in the page, run
  `document.documentElement.innerHTML='<body style="margin:0"><iframe id="f" src="/groups/reports" style="width:390px;height:780px;border:0;display:block;margin:0 auto"></iframe></body>'`
  (then `document.getElementById('f').contentWindow` for scrolling/measuring `scrollWidth`).
- **Shell heredocs with apostrophes break** in this Bash tool ("unexpected EOF"); write files with the
  Write tool and use small Python/sed edits. Lint with `pnpm lint` (autofixes imports/prop order),
  then `pnpm exec tsc --noEmit`. `messages/en.d.json.ts` regenerates itself: commit it.
- **Messages:** edit `messages/en.json` and `es.json` together. A tiny Python merge that keeps key
  order (`json.dumps(..., ensure_ascii=False, indent=2)`, keep the trailing newline) round-trips
  cleanly. Client namespaces go in `i18n/client-namespaces.ts`; prefer passing labels as props.
- **Console check:** after loading a page, `read_console_messages` with `onlyErrors` and a `.`
  pattern; old messages stay in the log, so clear (`clear: true`) before the run you care about.
- **Canvas:** open the Staff App canvas, page "Small group reports", click a board's expand icon,
  then the play button (top right) to get a menu of every board by name ("New report · 2 one person
  at a time", "Edit report (always the list)", "Nuevo reporte · revisar, 1024 (ES)", ...). The New
  report boards are clickable prototypes. The page needs the user's claude.ai session (it is open in
  Chrome).
- **Sign-in switching in Chrome:** `fetch('/api/auth/sign-out', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'})`,
  open `/sign-in`, click the email field (~(1114,362) at a 1553px-wide screenshot), type, click the
  password field (~(1090,433)), type, Enter.

### Test data and accounts (local test DB; the user said it is fine to change)

Accounts `sgla-admin@`, `sgla-leader@`, `sgla-deacon@`, `sgla-user@example.test`; they share one
test password, which the user gave in chat (ask them; it is deliberately not written here).

| Account | Role | Linked member | What it shows |
| --- | --- | --- | --- |
| sgla-leader | smallGroupLeader | Test Leader | leads SGLA Alpha, co-leads SGLA Beta, led the closed SGLA Delta. **Can submit**: use it for Stages 4–7 |
| sgla-admin | admin | none | full list, **New report disabled** with the reason (the `Reports-Unlinked` board) |
| sgla-deacon | deacon | none | "Your account isn't linked" empty state, no New report |
| sgla-user | user | n/a | `/groups/reports` is the 404 page, no Groups nav |

Real accounts (`Luis Palacios`, an unlinked admin) share the same DB and see ~29 seeded reports for
the `GP - #n` groups. To check a **linked full role** (admin/elder), link `sgla-admin` to a member with
`PUT /members/{id}/user` from the members page, then unlink afterwards.

Groups (ids): Alpha 29 (Mondays, leader Test Leader), Beta 30 (Wednesdays, leader Test Deacon,
Test Leader is co-leader), Gamma 31 (Fridays, someone else's: out of the leader's scope), Delta 32
(closed 2026-10-15). Session 1 **backdated every SGLA membership by 60 days** (they all started today
before, so past rosters were empty) and **seeded reports 151–162** (three per group, marker text
`SGLA test…` in the prayer request and observations) through a scratch script that is not in the
repo. Who submitted: Alpha 151 and 153 by Test Leader, 152 by co-leader Test Member Dos; Beta 154 and
156 by Test Deacon, 155 by Test Leader; Gamma 157–159 by Test Member Uno; Delta 160–162 by Test
Leader. To remove them: delete attendances then reports whose `group_prayer_request LIKE 'SGLA test%'`.
Creating reports through the new flow will add more rows for the same groups; any date up to today
without a report is free (the list shows not-filed rows for Alpha 2026-09-21 and Beta 2026-09-23).

### Checks already done (don't repeat; Stage 8 re-runs them against the finished feature)

- Stage 2 list as admin (unlinked), as leader (My reports, closed badge, not-filed + File report),
  as deacon (not linked), as user (404). Stage 3 detail: closed read-only (no Edit/Delete, no links to
  member pages for scoped roles). **Observation privacy, including the HTML/flight payload**
  (fetch the page and count the note text): leader sees notes on reports 151/153/155 (their own),
  zero on 152/154 (other submitters); admin sees all of 151/152/154/157/160.
- Fixed in this session: scoped roles that can't submit no longer get a disabled New report
  (only a full role does).

### Known gaps, not yet seen in the UI

- Phone **Filters sheet** content (only opened); **Show more** (button present, not clicked).
- A report with no shared text (`nothingShared`), and one whose address differs from the group's.
- Date range picker interaction (calendar popover) was not exercised.
- Spanish on every detail state, the 1024 detail layout, and light mode for the scoped views.
- No leader/deacon view of the **Group detail** card or the dashboard yet (Stage 7).

### Starter prompt for the next session

> Continue `docs/design/SMALL-GROUP-REPORTS.md` in this repo at **Stage 4**. Read the
> "Pick-up notes" section first, then `../docs/specs/small-group-reports.md`, then open the Small
> group reports page of the Staff App canvas for the stage's boards. Stages 1–3 are committed on
> branch `small-group-reports`; keep going on that branch, one commit per stage, log filled in
> (fill the previous stage's hash in each new commit). Use the `sgla-leader@example.test` account
> (ask me for the shared test password) for stages 4–7 and the other accounts for stage 8. Light and
> dark, 1440 / 1024 / 390, English and Spanish. The API is running on :8000; if it isn't, tell me
> instead of stubbing.

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
- [x] Observations: admins and elders see them; the submitter sees their own; another leader of
      the group, a deacon and a co-leader editing someone else's report never do (check the network
      response too, not just the UI). (Seen as admin, elder, the submitter, another leader, the co-leader and a deacon, API and HTML.)
- [x] Unlinked admin/elder: **New report** disabled with the reason; the dashboard and Group
      detail don't offer New report. (Seen as admin and elder, linked and unlinked.)
- [x] Closed group: report detail read-only, no Edit/Delete, no New report on its card.
- [x] Duplicate date caught on the date step; future dates not selectable; Submit disabled until
      everyone is marked; the draft survives a reload and is cleared after submit. (Future days were selectable in the calendar: fixed in Stage 8.)
- [ ] Focus: each person step lands on the name; dialogs return focus to their trigger.
- [x] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean);
      `messages/parity.ts` passes.
- [x] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
