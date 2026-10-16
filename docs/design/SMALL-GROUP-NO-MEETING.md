# Small group reports: "No meeting" (mark a date the group didn't meet)

Implementation spec for **no meeting** (Groups ▸ Reports, `/groups/reports`, plus the dashboards
and Group detail), which is **new** today: a leader can say the group didn't meet on a date, with an
optional reason, so the date stops showing as Due / Not filed.

- **New report, step 1:** "Did the group meet on this date?" Yes (default) / No meeting. *No* hides
  the address and the attendance choice and shows a reason field + **Save as no meeting**.
- **Shortcut dialog** on any missing meeting: leader dashboard ("Tue, Sep 29 has no report yet"),
  Reports *Not filed* rows (table and phone cards), the group's *Recent meetings* "Not filed" row.
- **Display everywhere a report shows:** Reports list (new filter chip + row variant), a no-meeting
  detail page (edit reason / delete / "file a report instead"), the elder week view (new status),
  Needs follow-up dots, Group detail Recent meetings.
- **Fixing a mistake:** picking a no-meeting date in New report shows the mark and
  **The group met: replace with a report**; the mark is replaced only when that report is submitted.

**Decided:** stored as a report with `held: false` (API spec below); reason is optional free text
(≤ 255) and visible to anyone who can see the group's reports; today or earlier only; same
permissions as reports (leaders/co-leaders create; elders and the group's leaders edit/delete;
closed groups read-only); a held report is never turned into a no meeting (delete it first); no
per-church schedule yet.

**Depends on the API:** `membership-management/docs/SMALL-GROUP-NO-MEETING-API-HANDOFF.md`
(stages 1–3 at least). If a stage here starts before the API is ready, note it and stub nothing in
committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`small-group-no-meeting`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, in English and Spanish,
before the next one starts. After each stage, write a short summary in the progress log.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Small group reports", row **"No meeting: when the group didn't meet"** (and its blue rules
  sticky). The existing rows were updated too: Reports list, Leader dashboard and the elder week
  view now show no-meeting data.
- **Boards:** `ReportForm-NoMeeting` (step 1, No selected), `ReportForm-Replace` (date already
  marked; click *replace* in Play), `ReportForm-Phone-NoMeeting`, `LeaderDashboard-NoMeetingDialog`,
  `LeaderDashboard-Phone-NoMeetingDialog-Dark-ES`, `NoMeetingDialog` (the component, `kind` mark/edit),
  `Reports-Leader-Marked` (rows + toast), `Reports` (admin list with the No meeting chip),
  `ReportDetail-NoMeeting`, `ReportDetail-NoMeeting-Edit`, `ReportDetail-NoMeeting-Phone-Dark-ES`,
  `LeaderDashboard-Elder` / `-LastWeek` (status + follow-up dot).
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API types, client and server actions | ⬜ | |
| 2. New report step 1: met question, no-meeting form, replace | ⬜ | |
| 3. No meeting dialog and shortcuts | ⬜ | |
| 4. Reports list and no-meeting detail | ⬜ | |
| 5. Dashboards and Group detail | ⬜ | |
| 6. Design review fixes | ⬜ | |

### Decisions and deviations

- [Anything decided during implementation, or where the build intentionally differs from the canvas.]

## Token changes

None. "No meeting" uses the existing neutral `StatusBadge` tone (same as *No leader*), with a
**solid** dot so it reads differently from the ring-dot neutral statuses.

## The API

See the API handoff for full shapes. What the staff app uses:

| Call | Change |
| --- | --- |
| `POST /small-groups/{id}/reports` | No meeting: `{ held: false, meetingDate, notHeldReason }`. Held: unchanged, plus `replacesNoMeeting: true` when replacing. |
| `PATCH /small-group-reports/{id}` | No meeting: `{ held: false, meetingDate, notHeldReason }` (edit reason). |
| `DELETE /small-group-reports/{id}` | Unchanged. |
| `GET /small-group-reports/{id}` | `held`, `notHeldReason`; empty attendances for a no meeting. |
| `GET /small-group-reports` | Items `held`, `notHeldReason`; `status=all|filed|notHeld|notFiled`; `counts.notHeld`. |
| `GET /small-group-reports/summary` | `lastReport` is held only; `recentMeetings[].held` (`null` = not filed). |
| `GET /small-group-reports/week` | `status: "notHeld"`; `reports[].held`, `notHeldReason`. |
| `GET /small-groups/{id}/report-roster` | `existingReportHeld`. |
| 409 duplicate | body adds `existingReportHeld`. |

Errors: reuse the existing report error map (`ApiErrors` / report actions). New 422 kind-change
error should never be reachable from the UI; map it to the generic error.

## Stage 1: API types, client and server actions

**Files:** `api/small-groups-api/types.ts`, `api/small-groups-api/client.ts`,
`app/(app)/groups/reports/_actions/report-actions.ts`, `_lib/report-schema.ts`, `_lib/report-body.ts`.

- Types: `held`, `notHeldReason` on report detail / list item / week report; `ReportWeekStatus` adds
  `"notHeld"`; `RecentMeeting.held: boolean | null`; roster `existingReportHeld`; list counts
  `notHeld`; list status filter value `notHeld`.
- Zod: `noMeetingSchema = { meetingDate, notHeldReason: string ≤ 255, trimmed, "" → undefined }`.
- Actions: `markNoMeeting(groupId, date, reason)`, `updateNoMeetingReason(reportId, date, reason)`;
  `submitReport` accepts `replacesNoMeeting`. Revalidate the same paths the report actions do.
  Each returns the same `{ ok } | { error }` shape the others use.

## Stage 2: New report step 1 (`/groups/reports/new`)

**Files:** `_components/meeting-step.tsx`, `_components/report-flow.tsx`, `_components/date-problem-note.tsx`,
`_components/meeting-date-picker.tsx`, `_lib/report-draft.ts`. Boards: `ReportForm-NoMeeting`,
`ReportForm-Replace`, `ReportForm-Phone-NoMeeting`.

### "Did the group meet on this date?"

- Below the date, inside the meeting card: a fieldset legend + two pressed-state buttons (reuse
  `yes-no-buttons.tsx` styling): **Yes, we met** (check icon, success when pressed) and **No meeting**
  (calendar-x icon, neutral when pressed). Default **Yes**, so the common path is unchanged.
- **Yes:** exactly today's step (address, "How do you want to take attendance?", Cancel).
- **No:** hide the address field and the attendance-choice fieldset. Show a second card
  ("No meeting" eyebrow, *The group didn't meet*): optional **Reason** textarea (3 rows, maxLength
  255, counter `n / 255`, hint below the label), an info note (*{date} won't count as a missing
  report on dashboards or in Reports.*), and a footer: **Cancel** (secondary, back to the list) and
  **Save as no meeting** (primary). Phone: both buttons full width, stacked.
- Save → `markNoMeeting` → go to the list the user came from (or My reports) with the toast
  **Marked as no meeting** (board `Reports-Leader-Marked`). Focus the toast region per the list's
  existing toast pattern.
- The stepper isn't shown on step 1 today; keep it that way (no "1 / 4" on phone for No).
- Draft: the met choice and reason live in the same draft as the rest of step 1; switching back to
  Yes keeps the reason in memory but doesn't send it.

### The date already has something

- Held report on the date: unchanged duplicate error (red), attendance choice disabled.
- **No meeting on the date** (`existingReportHeld === false`): an amber info box under the date (not
  an error): **Thursday, Oct 1 is marked as no meeting:** *"reason"* (omit the quote if no reason),
  then **The group met: replace with a report** (secondary button) and **Open it** (link to the
  no-meeting detail). The met question is hidden and the attendance choice is disabled until the
  user clicks replace.
- After replace: the box becomes a muted line, *The no-meeting mark for Oct 1 will be replaced when
  you submit this report.* + **Undo**; the attendance choice enables; the draft carries
  `replacesNoMeeting: true` through to submit. Nothing is deleted before submit.
- If the submit 409s with `existingReportHeld: true` (someone filed meanwhile), show today's
  duplicate error.

### Date picker

Add a third legend item and day marker: **No meeting** = small filled dot in `text-subtle` (filed
stays the success dot, the meeting weekday the hollow gold ring). Needs the month's no-meeting
dates: from the list endpoint for that group/month if the picker already fetches filed dates there,
otherwise from the roster calls; note which in *Decisions*.

## Stage 3: No meeting dialog and shortcuts

**Files:** new `app/(app)/groups/reports/_components/no-meeting-dialog.tsx`; callers below. Boards:
`NoMeetingDialog`, `LeaderDashboard-NoMeetingDialog`, `LeaderDashboard-Phone-NoMeetingDialog-Dark-ES`.

- HeroUI Modal (same shell as `components/confirm-dialog.tsx`: 480 max width, bottom-aligned on
  phone). Icon tile (calendar-x, neutral), eyebrow = group name, title **No meeting on {weekday,
  month day}?**, body *The date won't count as a missing report. If the group did meet, file a
  report instead.*, Reason textarea (focused on open) with hint + counter, footer **Cancel** /
  **Mark as no meeting**. `kind="edit"`: title **Edit the reason**, body *The date stays marked as
  no meeting.*, button **Save**, textarea prefilled.
- After success: close, toast **Marked as no meeting** (or **Reason saved**), refresh the caller.
  Return focus to the row's next focusable element (the row itself is gone from "not filed").
- Shortcut placements (only where the viewer can file a report for that group, the same check as the
  existing **File report** / **File it** actions):
  - Leader dashboard, *Meetings without a report* box: copy becomes **{Tue, Sep 29} has no report
    yet.** (was "the group met but…"), actions **File it** · **No meeting**.
  - Reports list Not filed rows: desktop a secondary **No meeting** button right of **File report**;
    phone card a 2-column row (File report | No meeting). Card note copy: *This meeting has no
    report yet.*
  - Group detail, Recent meetings card, "Not filed" row: same secondary action.

## Stage 4: Reports list and no-meeting detail

**Files:** `_components/reports-table.tsx`, `report-card.tsx`, `reports-list.tsx`,
`report-summary-tiles.tsx` (if it counts filed), `_lib/report-filters.ts`, `[id]/page.tsx`, new
`_components/no-meeting-detail.tsx`. Boards: `Reports`, `Reports-Leader-Marked`,
`ReportDetail-NoMeeting`, `-Edit`, `-Phone-Dark-ES`.

### List

- Status filter: **All / Filed / No meeting / Not filed** with counts from `counts`.
- No-meeting row (table): date as usual; group cell adds the reason on a second line (13px italic
  muted, one line, ellipsis, full text in `title`); At the meeting / At church = `—`; Submitted by =
  neutral **No meeting** badge (solid dot) over *Marked by {name}*; action **Open**. No row tint.
- Below `lg` (no Submitted by column): the date's sub-line reads **No meeting**.
- Phone card: badge **No meeting**; body = reason in italics (or nothing); footer *Marked by
  {name}* + **Open**.

### Detail (`/groups/reports/[id]` when `held === false`)

Render `NoMeetingDetail` instead of the report layout (same page route and loader):

- Breadcrumb and eyebrow as the report detail; h1 = long date; under it the **No meeting** badge +
  *Marked by {name} on {date, time}*.
- Actions (with `permissions.canEdit` / `canDelete`): **Group page**, **Delete** (existing delete
  dialog with copy *Delete this no-meeting mark?* / body *{date} will show as Not filed again if it
  was a meeting day.* / **Delete**), **Edit reason** (primary, opens the dialog `kind="edit"`).
- Card: "Reason" eyebrow, *The group didn't meet*, the reason in the serif italic used for group
  texts (or *No reason given.* muted), info note *This date doesn't count as a missing report…*.
- Side card (dashed): **Did the group meet after all?** + body + **File a report for {Oct 1}** →
  `/groups/reports/new?group=…&date=…`, which lands in the replace state of stage 2. Hidden for
  closed groups and for viewers who can't file.
- Closed group: the existing read-only note; no actions.

## Stage 5: Dashboards and Group detail

**Files:** `app/(app)/_components/report-week/*` (`week-status.ts`, `week-counts.tsx`, `week-rows.tsx`,
`week-table.tsx`, `week-cards.tsx`), `needs-follow-up-card.tsx`, `leader-dashboard.tsx`,
`groups/[id]/_components/group-reports-card.tsx`. Boards: `LeaderDashboard-Elder`, `-LastWeek`,
`LeaderDashboard`.

- `WEEK_STATUS_ORDER`: insert `"notHeld"` right after `"submitted"` (they share a rank; keep API
  order inside it). `WEEK_STATUS_BADGE.notHeld = { tone: "neutral", variant: "solid-dot" }`.
  Count chip: *{n} no meeting*.
- Week row/card for `notHeld`: under the date, the reason (13px italic, ellipsis at ~220px in the
  table; wraps in cards); attendance and observations `—`; action **View** → the no-meeting detail.
- Needs follow-up: a fourth dot style for `recentMeetings[].held === false` — transparent fill,
  1.5px solid `border-subtle`, muted day number; legend adds **No meeting**. Text becomes
  **{n} not filed in the last 4 weeks** (the "of the last 4 meetings" wording is wrong once a dot
  isn't a meeting). Only not-filed dates count toward the threshold (API already does this).
  `aria-label` lists each date with its word (filed / not filed / no meeting).
- Leader dashboard *Last report* uses `lastReport` (already held-only from the API).
- Group detail *Recent meetings*: a no-meeting row shows the date, **No meeting** badge, reason,
  and links to the detail; the "Not filed" row gets the shortcut from stage 3.

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `ReportForm.metQuestion` | Did the group meet on this date? | ¿El grupo se reunió en esta fecha? |
| `ReportForm.metYes` | Yes, we met | Sí, nos reunimos |
| `ReportForm.metNo` | No meeting | No hubo reunión |
| `ReportForm.noMeetingEyebrow` | No meeting | Sin reunión |
| `ReportForm.noMeetingTitle` | The group didn’t meet | El grupo no se reunió |
| `ReportForm.reasonLabel` | Reason | Motivo |
| `ReportForm.reasonHint` | For example a holiday, the weather, or the leaders were away. Anyone who can see this group’s reports can read it. | Por ejemplo, un feriado, el clima o que los líderes estaban fuera. Cualquier persona que pueda ver los reportes de este grupo puede leerlo. |
| `ReportForm.noMeetingEffect` | {date} won’t count as a missing report on dashboards or in Reports. | {date} no contará como reporte pendiente en los paneles ni en Reportes. |
| `ReportForm.saveNoMeeting` | Save as no meeting | Guardar sin reunión |
| `ReportForm.legendNoMeeting` | No meeting | Sin reunión |
| `ReportForm.noMeetingOnDate` | {date} is marked as no meeting: | El {date} está marcado sin reunión: |
| `ReportForm.replaceWithReport` | The group met: replace with a report | Sí hubo reunión: reemplazar con un reporte |
| `ReportForm.openNoMeeting` | Open it | Abrirlo |
| `ReportForm.replacing` | The no-meeting mark for {date} will be replaced when you submit this report. | La marca de sin reunión del {date} se reemplazará cuando envíes este reporte. |
| `ReportForm.undo` | Undo | Deshacer |
| `NoMeetingDialog.title` | No meeting on {date}? | ¿No hubo reunión el {date}? |
| `NoMeetingDialog.body` | The date won’t count as a missing report. If the group did meet, file a report instead. | La fecha no contará como reporte pendiente. Si el grupo sí se reunió, envía un reporte. |
| `NoMeetingDialog.editTitle` | Edit the reason | Editar el motivo |
| `NoMeetingDialog.editBody` | The date stays marked as no meeting. | La fecha sigue marcada sin reunión. |
| `NoMeetingDialog.reasonHint` | Anyone who can see this group’s reports can read it. | Cualquier persona que pueda ver los reportes de este grupo puede leerlo. |
| `NoMeetingDialog.mark` | Mark as no meeting | Marcar sin reunión |
| `NoMeetingDialog.save` | Save | Guardar |
| `NoMeetingDialog.markedToast` | Marked as no meeting | Marcado sin reunión |
| `NoMeetingDialog.savedToast` | Reason saved | Motivo guardado |
| `ReportsList.noMeeting` | No meeting | Sin reunión |
| `ReportsList.noMeetingAction` | No meeting | No hubo reunión |
| `ReportsList.markedBy` | Marked by {name} | Marcado por {name} |
| `ReportsList.missingNote` | This meeting has no report yet. | Esta reunión aún no tiene reporte. |
| `ReportDetail.noMeeting` | No meeting | Sin reunión |
| `ReportDetail.markedOn` | Marked by {name} on {dateTime} | Marcado por {name} el {dateTime} |
| `ReportDetail.editReason` | Edit reason | Editar motivo |
| `ReportDetail.didntMeet` | The group didn’t meet | El grupo no se reunió |
| `ReportDetail.noReason` | No reason given. | No se indicó un motivo. |
| `ReportDetail.noMeetingEffect` | This date doesn’t count as a missing report on dashboards or in Reports. | Esta fecha no cuenta como reporte pendiente en los paneles ni en Reportes. |
| `ReportDetail.metAfterAllTitle` | Did the group meet after all? | ¿El grupo sí se reunió? |
| `ReportDetail.metAfterAllBody` | File a report for this date. This mark is replaced when you submit it, so nothing is lost if you stop halfway. | Envía un reporte para esta fecha. Esta marca se reemplaza cuando lo envíes, así que no se pierde nada si lo dejas a medias. |
| `ReportDetail.fileInstead` | File a report for {date} | Enviar un reporte para el {date} |
| `ReportDetail.deleteNoMeetingTitle` | Delete this no-meeting mark? | ¿Eliminar esta marca de sin reunión? |
| `ReportDetail.deleteNoMeetingBody` | {date} will show as Not filed again if it was a meeting day. | El {date} volverá a aparecer como sin reporte si era día de reunión. |
| `GroupsDashboard.statusNotHeld` | No meeting | Sin reunión |
| `GroupsDashboard.chipNotHeld` | no meeting | sin reunión |
| `GroupsDashboard.legendNoMeeting` | No meeting | Sin reunión |
| `GroupsDashboard.notFiledInWeeks` | {count} not filed in the last 4 weeks | {count} sin reporte en las últimas 4 semanas |
| `GroupsDashboard.view` | View | Ver |
| `LeaderDashboard.noReportYet` | {date} has no report yet. | El {date} aún no tiene reporte. |
| `LeaderDashboard.noMeetingAction` | No meeting | No hubo reunión |

Reuse existing keys where one already says the same thing (check `messages/en.json` first); keep
`messages/parity.ts` green.

## Not in this spec

- Per-church "never meets on…" schedules; marking future dates; reason categories.
- Turning a held report into a no meeting (delete first, by design).
- Rescheduled meetings (report on another weekday): unchanged.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; list pages switch table → cards
      below `md`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; every status shows a dot and a word (No meeting =
      neutral, solid dot).
- [ ] Focus ring visible on every control; the dialog traps focus, focuses the reason, and returns
      focus sensibly.
- [ ] A no-meeting date never shows Due / Not filed anywhere (dashboard leader + elder, list, group
      detail, follow-up) and never counts as Filed or Last report.
- [ ] Replace flow: abandoning the new report leaves the mark intact; submitting replaces it.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
