# Groups dashboard: nested Dashboard menu, weekly reports and follow-up

Implementation spec for the **groups dashboard** (Dashboard ▸ Groups and Dashboard ▸ Staff in the
sidebar, `/` and `/dashboard/staff`). Today `/` is the admin/elder dashboard (applications, users,
invites, plus *My groups* for those who lead), or the leader dashboard for scoped roles. Read the
cross-repo spec first: `../docs/specs/groups-dashboard.md` (workspace folder
`members-management/docs/specs/`); its rules are referred to as *rule N*, and the reports spec's as
*reports rule N*. After this work:

- **Menu.** Admins and elders get Dashboard ▸ **Groups** / **Staff** and land on Groups. Leaders,
  deacons and roles with no group access keep a single Dashboard item.
- **Staff** (`/dashboard/staff`): today's admin/elder dashboard without the groups parts.
- **Groups** (`/` for admins and elders): **Needs follow-up** (groups behind on reports or without
  a leader), **the week** (every open group's report status for a Sunday–Saturday week, with
  attendance, observation count and a link), then **My groups** as today.

**Decided:** everything in the cross-repo spec's *Rules*, plus these UI decisions (don't reopen):

- In the submenu, **Groups comes before Staff** (it's the landing page).
- The week travels in the URL as `?week=YYYY-MM-DD` (that week's Sunday), so Back and shared links
  keep it. Missing, malformed or future → the current week. No `week` param is written for the
  current week.
- The week's title: **This week**, **Last week**, otherwise **Week of {Sunday}**. The stepper shows
  the range ("Oct 11 – 17"); next is a disabled button on the current week.
- A missed meeting is **Due** in the current week and **Not filed** in past weeks (same API status,
  `notFiled`).
- A group with several reports in the week shows the newest, plus a "+N more this week" link to the
  list filtered to that group and week.
- Needs follow-up is hidden when nothing qualifies (no "all caught up" message). It does not follow
  the week stepper (rule 9).
- `FOLLOW_UP_MIN_NOT_FILED = 2`, one constant next to the follow-up component.
- **Table from `xl` up, cards below.** This differs from the list pages (`md`): five columns plus the
  sidebar don't fit at 1024, and the 1024 board shows cards.
- No polling or auto-refresh; the page is dynamic and reads fresh data on each visit.

**Depends on the API:** `membership-management/docs/GROUPS-DASHBOARD-API-HANDOFF.md` (stage 1
for the follow-up card, stage 2 for the week). Stage 1 here needs nothing new. If a stage starts
before the API is ready, note it and stub nothing in committed code.

**Week logic already exists:** `defaultReportRange` in `app/(app)/groups/reports/_lib/report-filters.ts`
computes the current Sunday–Saturday week (the reports list's default range). Stage 3 moves that
arithmetic to a shared helper instead of copying it.

Work through it **stage by stage**, one reviewable commit per stage, on the **`groups-dashboard`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each
stage, write a short summary of what changed and anything that differs from the canvas in the
progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Small group reports"**, row **"Dashboard ▸ Groups · admin/elder weekly view"**, and its
  blue note. Every board has Tweaks for mode, lang, size, user (`leader` / `elder`) and week
  (`this` / `last`).
- **Boards:**
  - Groups: `LeaderDashboard-Elder` (this week), `LeaderDashboard-Elder-LastWeek`,
    `LeaderDashboard-Elder-Dark-ES`, `LeaderDashboard-Elder-Tablet` (1024, cards),
    `LeaderDashboard-Elder-Phone` (390).
  - Leaders (unchanged, for the single menu item): `LeaderDashboard`, `LeaderDashboard-Phone`.
  - Staff: `Dashboard`, `Dashboard-Dark` on page "Dashboard & applications" (its *No groups yet*
    card moves to Groups, rule 2).
  - Menu: `Sidebar` on page "Shell components" (`user` admin/elder/leader, `active` dashGroups /
    dashStaff / dashboard).
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced 2026-10-15.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Menu and routes (`/`, `/dashboard/staff`) | ✅ | see `git log` |
| 2. API types and client | ✅ | see `git log` |
| 3. The week | ⬜ | |
| 4. Needs follow-up | ⬜ | |
| 5. Design review fixes | ⬜ | |

### Decisions and deviations

- Stage 1: `StaffDashboard` takes `firstName` and `role` (it derives the staff-admin check itself).
  `GroupsDashboard` exists with the interim body (greeting, `NoGroupsCard`, `MyGroupsSection ledOnly`)
  and its own `GroupsDashboard.description`. Sidebar needed no change. Checked in the browser as
  admin; leader/deacon redirect from `/dashboard/staff` is by code only (no such login used).
- Stage 2: types match the running API's OpenAPI schema. `getSmallGroupReportSummary` is now a
  React `cache()`d function.

## Token changes

None expected: the boards use existing tokens (warning-soft, success-soft, accent, surface and
separator). If the dashed "not filed" chip border needs a token that doesn't exist, add it in its
own stage first, per the template.

New Tailwind utilities needed: none.

## The API

Shapes are in the cross-repo spec, *Contracts*.

| Call | Who | Used by |
| --- | --- | --- |
| `GET /small-group-reports/summary` (+ `hasLeader`, `recentMeetings`) | full and scoped | Needs follow-up, My groups |
| `GET /small-group-reports/week?date=` | full only | The week |

| Status | `detail` contains | UI |
| --- | --- | --- |
| 422 | `future` | Can't happen from the UI (the param is clamped first); treat as the generic error |
| 403 | | Can't happen (only full roles call it); generic error |

## Stage 1: Menu and routes

**Files:** `config/site.ts`, `components/sidebar.tsx` (only if needed), `app/(app)/page.tsx`,
`app/(app)/dashboard/staff/page.tsx` (new), `app/(app)/_components/staff-dashboard.tsx` (new),
`messages/en.json`, `messages/es.json`.

- `config/site.ts`: replace the Dashboard item with two, filtered by the existing `access` field:
  - `{ labelKey: "dashboard", icon: "dashboard", access: ["full"], items: [{ labelKey:
    "dashboardGroups", href: "/" }, { labelKey: "dashboardStaff", href: "/dashboard/staff" }] }`
  - `{ labelKey: "dashboard", icon: "dashboard", href: "/", access: ["scoped", "none"] }`
  - Add both label keys to `NavLabelKey`. `isActivePath` already matches `/` exactly, and
    `CollapsibleItem` picks the longest matching child, so `/dashboard/staff` marks Staff only and
    `/` marks Groups only. The group opens itself when a child is active.
- Move the admin/elder body of `app/(app)/page.tsx` (header with *Add member* / *Invite staff*,
  stat tiles, recent applications, needs your attention) into `StaffDashboard`, **without**
  `MyGroupsSection` and `NoGroupsCard`.
- `app/(app)/dashboard/staff/page.tsx`: full roles render `StaffDashboard`; anyone else
  `redirect("/")`.
- `app/(app)/page.tsx` dispatches on `getSmallGroupAccess(session.user.role)`: `scoped` →
  `LeaderDashboard` (unchanged); `none` → `StaffDashboard`; `full` → the Groups dashboard. Until
  stage 3 it shows the greeting, `NoGroupsCard` and `MyGroupsSection ledOnly`, which already work.
- Check the `[...slug]` catch-all doesn't take `/dashboard/staff` (an explicit route wins, but try
  it).

## Stage 2: API types and client

**Files:** `api/small-groups-api/types.ts`, `api/small-groups-api/client.ts`.

```ts
export interface ReportRecentMeeting { date: string; reportId: number | null }
// ReportSummaryGroup gains:
//   hasLeader: boolean;
//   /** Newest first; at most 4 for a weekly group. */
//   recentMeetings: ReportRecentMeeting[];

export type ReportWeekStatus =
  | "submitted" | "notFiled" | "today" | "upcoming" | "noLeader" | "noMeetingDay";

export interface ReportWeekReport {
  id: number; meetingDate: string; rosterCount: number; attendedGroupCount: number;
  attendedChurchCount: number; observationCount: number; submittedBy: ReportPerson;
}
export interface ReportWeekGroup {
  smallGroup: { id: number; name: string; meetingDay: Weekday | null };
  leaders: { memberId: number; name: string; role: SmallGroupRole }[];
  status: ReportWeekStatus;
  meetingDate: string | null;
  /** Newest first. */
  reports: ReportWeekReport[];
}
export interface ReportWeek {
  weekStart: string; weekEnd: string; today: string; isCurrentWeek: boolean;
  groups: ReportWeekGroup[];
}
```

- `getSmallGroupReportWeek(date?: string): Promise<ReportWeek>`, `cache: "no-store"` like the
  summary.
- Wrap `getSmallGroupReportSummary` in React `cache()` (or share one promise from the page) so the
  follow-up card and *My groups* make **one** summary request per render.

## Stage 3: The week (`/`, admins and elders)

**Files:** `app/(app)/_components/groups-dashboard.tsx` (new, `GroupsDashboard`),
`app/(app)/_components/report-week/` (new: section, table, cards, stepper, skeleton),
`app/(app)/_lib/week-param.ts` (new), `lib/format-date.ts`, messages.

### Page

- `GroupsDashboard({ firstName, week })`: `StaffAppPageHeader` with the greeting (as the other
  dashboards), description `GroupsDashboard.description`, no actions. Then, in order: follow-up
  (stage 4; leave its slot empty here), the week, `MyGroupsSection ledOnly`.
- No open groups at all (the week's `groups` is empty): show `NoGroupsCard` instead of the week and
  the follow-up card (rule 3).
- Each block awaits its own promise in its own `Suspense` with `settle()`, so one failing call
  shows its message and the rest of the page still renders.

### Week param

- `parseWeekParam(value, today)`: a valid `YYYY-MM-DD` → its Sunday; anything else, or a Sunday
  after the current one → null (current week). Reuse the Sunday arithmetic from
  `defaultReportRange` (`groups/reports/_lib/report-filters.ts`): move it to a shared helper rather
  than copying it.
- Call the API with that Sunday (or no `date` for the current week). The API's `today`,
  `weekStart`, `weekEnd` and `isCurrentWeek` are the truth from then on.

### Header

- `h2`: `thisWeek` / `lastWeek` / `weekOf` (`weekStart` formatted short). Description
  `weekDescription`.
- Right side: **All reports** text link (`/groups/reports`), then the stepper: a group of
  previous link (`?week={weekStart − 7}`), the range (`formatCalendarRange(weekStart, weekEnd,
  locale)`, new in `lib/format-date.ts` with `Intl.DateTimeFormat#formatRange`, month short +
  day, UTC so calendar dates don't shift), and next: a link (`?week={weekStart + 7}`, no param
  when that is the current week) or a disabled button when `isCurrentWeek`. Icon buttons are 40px
  inside a 44px-tall group, with `aria-label`s.

### Count chips

- One pill per status with at least one group, in rule 8's order, using `StatusBadge`-style pills:
  `notFiled` warning (ring dot), `today` accent (solid), `upcoming` neutral (ring), `submitted`
  success (solid dot), `noLeader` and `noMeetingDay` neutral (ring). The count is bold
  (`<strong>` rich text in the message). In the current week `notFiled` uses the **Due** wording.
- A `ul` with `aria-label={weekSummary}`.

### Rows

Sorted by rule 8, then group name. Same content in the table (`dataTable()`, `xl` up) and the
cards (`card()`, below `xl`, grid `auto-fill minmax(300px, 1fr)`).

- **Group:** name linking to `/groups/{id}`; under it the leaders joined with " · ", or `noLeader`
  in muted text.
- **Status:** the pill (labels in *Copy*), and under it `meetingDate` formatted
  (`formatCalendarShortWeekdayDate`). For `noLeader` with a meeting day, show
  `LeaderDashboard.meets` instead; for `noMeetingDay`, nothing. For a submitted group with more than
  one report, add "+N more this week" linking to
  `/groups/reports?groupId={id}&from={weekStart}&to={weekEnd}`.
- **At the meeting:** submitted only: "**10** of 12" and a 112px bar (track `bg-separator` or the
  nearest token, fill `bg-accent`, `aria-hidden`; the text carries the meaning). Otherwise a muted
  "—".
- **Observations:** submitted only: a chat-bubble icon (Heroicons `ChatBubbleBottomCenterTextIcon`)
  and the count in semibold heading color; 0 → "None" muted; otherwise a muted "—".
- **Action** (outline small button in the table, full-width footer link on cards), with
  `aria-label="{action}: {group}"`:
  - `submitted` → **View report** → `/groups/reports/{newest id}`;
  - `notFiled` → **See meetings** →
    `/groups/reports?groupId={id}&status=notFiled&from={today − 28 days}`;
  - everything else → **Open group** → `/groups/{id}`.

### States

- Loading: a skeleton of the header, five chips and six rows (table or cards by breakpoint).
- Error: `weekLoadFailed` in muted text where the rows would be; the header and stepper stay so
  another week can be picked.

## Stage 4: Needs follow-up

**Files:** `app/(app)/_components/needs-follow-up-card.tsx` (new), messages.

- Data: the (cached) summary. For each open group:
  - **behind** when `notFiledDates.length >= FOLLOW_UP_MIN_NOT_FILED`;
  - **no leader** when `!hasLeader`.
- Order: behind by `notFiledDates.length` descending then name, then no-leader groups by name. A
  group that is both shows once, as behind.
- Hidden when the list is empty. On error: a one-line `followUpLoadFailed` inside the card frame.
- Card: `card()` with `h2` `followUpTitle` plus a warning count badge, description
  `followUpDescription`, and on the right an `aria-hidden` legend (filed chip, not-filed chip).
- Items in a `ul` grid (`auto-fit minmax(min(280px, 100%), 1fr)`), each on `bg-surface-secondary`
  with a soft border:
  - group name (link to the group) and leaders;
  - behind: `recentMeetings` (newest first from the API) reversed to oldest → newest, one chip per
    date showing the day of the month: filed = success-soft fill, not filed = warning-soft fill with
    a dashed warning border (so the two differ by more than hue). The chip row is
    `role="img"` with `meetingsLabel` listing each date and whether it was filed. Then the `behind`
    line in warning text, and **See meetings** (same link as the week's not-filed rows);
  - no leader: the `noLeader` line in warning text and **Open group**.

## Stage 5: Design review fixes

Run the checklist below against every board listed above, fix, and log what changed.

## Copy

New keys; reuse existing ones where noted. ICU plural and rich text as the other messages do.

| Namespace.key | English | Español |
| --- | --- | --- |
| `Nav.dashboardGroups` | Groups | Grupos |
| `Nav.dashboardStaff` | Staff | Personal |
| `GroupsDashboard.description` | How every small group is doing this week. | Cómo van todos los grupos pequeños esta semana. |
| `GroupsDashboard.followUpTitle` | Needs follow-up | Necesitan seguimiento |
| `GroupsDashboard.followUpDescription` | Behind on reports in the last 4 weeks, or without a leader. | Atrasados con sus reportes en las últimas 4 semanas, o sin líder. |
| `GroupsDashboard.legendFiled` | Filed | Con reporte |
| `GroupsDashboard.legendNotFiled` | Not filed | Sin reporte |
| `GroupsDashboard.behind` | {missed, number} of the last {total, number} meetings not filed | {missed, number} de las últimas {total, number} reuniones sin reporte |
| `GroupsDashboard.meetingsLabel` | Last meetings: {list} | Últimas reuniones: {list} |
| `GroupsDashboard.meetingFiled` | {date} filed | {date} con reporte |
| `GroupsDashboard.meetingNotFiled` | {date} not filed | {date} sin reporte |
| `GroupsDashboard.noLeaderLine` | No leader, so nobody can file its reports. | Sin líder: nadie puede enviar sus reportes. |
| `GroupsDashboard.followUpLoadFailed` | Couldn’t check which groups are behind. | No se pudo revisar qué grupos están atrasados. |
| `GroupsDashboard.thisWeek` | This week | Esta semana |
| `GroupsDashboard.lastWeek` | Last week | Semana pasada |
| `GroupsDashboard.weekOf` | Week of {date} | Semana del {date} |
| `GroupsDashboard.weekDescription` | Every open group’s report for the week, Sunday to Saturday. | El reporte de cada grupo abierto, de domingo a sábado. |
| `GroupsDashboard.allReports` | All reports | Todos los reportes |
| `GroupsDashboard.weekNav` | Change week | Cambiar de semana |
| `GroupsDashboard.previousWeek` | Previous week | Semana anterior |
| `GroupsDashboard.nextWeek` | Next week | Semana siguiente |
| `GroupsDashboard.weekSummary` | Week summary | Resumen de la semana |
| `GroupsDashboard.weekLoadFailed` | This week’s reports couldn’t load. Try again in a moment. | Los reportes de la semana no se pudieron cargar. Inténtalo de nuevo en un momento. |
| `GroupsDashboard.status.due` | Due | Pendiente |
| `GroupsDashboard.status.notFiled` | Not filed | Sin reporte |
| `GroupsDashboard.status.today` | Meets today | Se reúne hoy |
| `GroupsDashboard.status.upcoming` | Upcoming | Próxima |
| `GroupsDashboard.status.submitted` | Submitted | Enviado |
| `GroupsDashboard.status.noLeader` | No leader | Sin líder |
| `GroupsDashboard.status.noMeetingDay` | No meeting day | Sin día de reunión |
| `GroupsDashboard.count.due` | {count, plural, other {<strong>#</strong> due}} | {count, plural, one {<strong>#</strong> pendiente} other {<strong>#</strong> pendientes}} |
| `GroupsDashboard.count.notFiled` | {count, plural, other {<strong>#</strong> not filed}} | {count, plural, other {<strong>#</strong> sin reporte}} |
| `GroupsDashboard.count.today` | {count, plural, one {<strong>#</strong> meets today} other {<strong>#</strong> meet today}} | {count, plural, one {<strong>#</strong> se reúne hoy} other {<strong>#</strong> se reúnen hoy}} |
| `GroupsDashboard.count.upcoming` | {count, plural, other {<strong>#</strong> upcoming}} | {count, plural, one {<strong>#</strong> próxima} other {<strong>#</strong> próximas}} |
| `GroupsDashboard.count.submitted` | {count, plural, other {<strong>#</strong> submitted}} | {count, plural, one {<strong>#</strong> enviado} other {<strong>#</strong> enviados}} |
| `GroupsDashboard.count.noLeader` | {count, plural, other {<strong>#</strong> without a leader}} | {count, plural, other {<strong>#</strong> sin líder}} |
| `GroupsDashboard.count.noMeetingDay` | {count, plural, other {<strong>#</strong> without a meeting day}} | {count, plural, other {<strong>#</strong> sin día de reunión}} |
| `GroupsDashboard.colGroup` | Group | Grupo |
| `GroupsDashboard.colStatus` | Status | Estado |
| `GroupsDashboard.colAttendance` | At the meeting | En la reunión |
| `GroupsDashboard.colObservations` | Observations | Observaciones |
| `GroupsDashboard.colActions` | Actions | Acciones |
| `GroupsDashboard.attendance` | <strong>{attended, number}</strong> of {total, number} | <strong>{attended, number}</strong> de {total, number} |
| `GroupsDashboard.observations` | {count, plural, =0 {None} one {# observation} other {# observations}} | {count, plural, =0 {Ninguna} one {# observación} other {# observaciones}} |
| `GroupsDashboard.moreReports` | +{count, number} more this week | +{count, number} más esta semana |
| `GroupsDashboard.noLeader` | No leader | Sin líder |
| `GroupsDashboard.viewReport` | View report | Ver reporte |
| `GroupsDashboard.seeMeetings` | See meetings | Ver reuniones |
| `GroupsDashboard.openGroup` | Open group | Abrir grupo |

Reused: `DashboardPage.morning/afternoon/evening` (greeting), `LeaderDashboard.meets` (a no-leader
row's weekday), `LeaderDashboard.myGroups`.

## Not in this spec

- Everything in the cross-repo spec's *Not in this spec*.
- Changing the leader dashboard (scoped roles) beyond the menu.
- Remembering the last viewed week.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; the week switches table →
      cards below `xl`.
- [ ] Menu: admin and elder see Dashboard ▸ Groups / Staff with the right child active on `/` and
      `/dashboard/staff`; leader, deacon and `user` see a single Dashboard; `/dashboard/staff` as a
      leader redirects to `/`.
- [ ] Staff no longer shows *My groups* or *No groups yet*; Groups shows both where rule 3 says.
- [ ] Week stepper: back several weeks and forward again; next disabled on the current week; a
      future or garbage `?week=` shows the current week.
- [ ] Due in the current week, Not filed in past weeks; no Meets today / Upcoming in past weeks.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Token changes (if any) are in `tokens/`, `pnpm tokens --check` passes.
- [ ] Gold never carries text on a light ground; status shows a dot and a word; filed / not filed
      chips differ by more than color.
- [ ] Focus ring visible on every control; keyboard order makes sense; icon buttons have labels.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
