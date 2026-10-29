# Church-wide no meeting: mark a whole week for every group

Implementation spec for **church-wide no meeting** (Dashboard ▸ Report status, `/`, the week
section), which is **new** today: an admin or elder marks a whole week as no meeting for every
open group in one step, with an optional reason, so leaders don't have to.

- **Next week on Report status:** the week stepper goes one week past the current one, so a
  cancellation can be marked ahead of time.
- **Mark button and confirm dialog** in the week section header, next to the stepper, with the
  counts of what will be marked and what stays as it is.
- **Week banner** once a week is marked: reason, who marked it and when, **Edit reason**, **Undo**.
- **"Church-wide" label** wherever a no meeting shows, so leaders can tell it from their own, and
  a note in the leader's Edit reason dialog that editing detaches it.

**Decided:** whole weeks only; current week, next week or a past week; every open group with a
meeting day is marked, with or without a leader, unless it already has any report or no meeting
dated in the week (those stay as they are and are never touched by Undo); running it again marks
only the groups still empty and keeps the reason; nothing is marked automatically; admins and
elders only (`smallGroups: all` + the report action), and marking needs a linked member. Rules:
`../docs/specs/church-wide-no-meeting.md` (*rule N* below).

**Depends on the API:** `membership-management/docs/CHURCH-WIDE-NO-MEETING-API-HANDOFF.md`
(stages 1–4). If a stage here starts before the API is ready, note it and stub nothing in
committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`church-wide-no-meeting`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, in English and Spanish,
before the next one starts. After each stage, write a short summary of what changed and anything
that differs from the canvas in the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Small group reports", rows **"Church-wide no meeting · marking next week ahead"** and
  **"… marked late, the remaining groups, edit reason, undo, leaders"** (and their blue rules
  sticky and orange note). The boards show the week section only; the rest of the page is the
  existing `LeaderDashboard-Elder` boards.
- **Boards:** `ChurchWideWeek` (the section component; Play runs mark → banner → edit → undo),
  `MarkWeekDialog` (the dialog component, `kind` mark / remaining / editReason / undo),
  `ChurchWide-Next` (button on next week), `ChurchWide-Next-Mark` (confirm),
  `ChurchWide-Next-Marked` (banner + toast), `ChurchWide-Phone-Mark`, `ChurchWide-Phone-Dark-ES`,
  `ChurchWide-ThisWeek-Mark` (marked late: 3 stay as they are), `ChurchWide-ThisWeek-Marked`
  (mixed rows), `ChurchWide-Remaining`, `ChurchWide-EditReason`, `ChurchWide-Undo`,
  `ReportDetail-NoMeeting-ChurchWide` and `-Edit` (`NoMeetingDialog` with `churchWide`: the detach
  note).
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced [YYYY-MM-DD].

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API types, client and server actions | ✅ | `276c100` |
| 2. Next week on Report status | ⬜ | |
| 3. Mark button and confirm dialog | ⬜ | |
| 4. Week banner: edit reason and undo | ⬜ | |
| 5. Church-wide label and the leader's detach note | ⬜ | |
| 6. Design review fixes | ⬜ | |

### Decisions and deviations

- Stage 1: the dialogs read their text from the client: `NoMeetingWeek` is in `CLIENT_NAMESPACES`.
  They need a dozen ICU plurals with counts from the week, too many to pass as props. The server
  actions translate the three error messages on the server, from the same namespace.
- Stage 1: the actions revalidate `/`, `/groups/reports` and `/groups/[id]` as layouts, so a
  report's detail page (`/groups/reports/{id}`) picks up an edited reason or an undo too.
- Stage 1: a failure returns `gone: true` for the 404, so the dialogs know to refresh on close.
  `markNoMeetingWeekAction` returns `marked` and `linkedCount`; `skipped` isn't passed on (the
  dialog's counts come from the loaded week, rule 13).
- Stage 1: the API is on membership-management's `church-wide-no-meeting` branch (stages 1–5 done),
  not merged to `main` yet.

## Token changes

None expected: the banner uses the existing no-meeting status colours and `card()`.

## The API

| Route | Use |
| --- | --- |
| `GET /small-group-reports/week?date=` | Accepts next week. New `noMeetingWeek` (or `null`); `reports[]` gain `noMeetingWeekId`. |
| `POST /no-meeting-weeks` | `{ date, reason }` → 201 first mark, 200 re-run (reason ignored). |
| `PATCH /no-meeting-weeks/{id}` | `{ reason }` → the week. |
| `DELETE /no-meeting-weeks/{id}` | Undo → 204. |
| `GET /small-group-reports`, `GET /small-group-reports/{id}` | Items and detail gain `noMeetingWeekId`. |

```ts
interface NoMeetingWeek {
  id: number;
  weekStart: string;            // "YYYY-MM-DD", a Sunday
  reason: string | null;
  createdBy: ReportPerson;
  createdAt: string;            // ISO timestamp
  updatedAt: string;
  linkedCount: number;          // reports still linked to the week
}

interface NoMeetingWeekMark extends NoMeetingWeek {
  marked: number;               // created by this call
  skipped: { reported: number; noMeetingDay: number };
}
```

Errors (status + a phrase from `detail`, never shown) → message keys:

| Status | `detail` contains | Message |
| --- | --- | --- |
| 403 | | the existing permission message |
| 409 | `Link your account to a member` | `NoMeetingWeek.needsMember` |
| 422 | `future` | `NoMeetingWeek.tooFarAhead` |
| 404 | | `NoMeetingWeek.gone` (someone undid it; refresh) |

## Stage 1: API types, client and server actions

**Files:** `api/small-groups-api/types.ts`, `api/small-groups-api/client.ts`, a new
`app/(app)/_actions/no-meeting-week-actions.ts`.

- Types above; `ReportWeek.noMeetingWeek: NoMeetingWeek | null`, `noMeetingWeekId: number | null`
  on `ReportWeekReport`, the list item and the detail.
- Client: `markNoMeetingWeek(date, reason)`, `updateNoMeetingWeekReason(id, reason)`,
  `deleteNoMeetingWeek(id)`.
- Server actions, shaped like `markNoMeeting` in `groups/reports/_actions/report-actions.ts`
  (`forbiddenUnless`, Zod for the reason ≤ 255 with blank → null, `{ ok: true, … } | failure`, no
  redirect): `markNoMeetingWeekAction` (`{ smallGroups: ["all"], smallGroupReports: ["create"] }`;
  returns the counts), `updateNoMeetingWeekReasonAction` (`update`), `undoNoMeetingWeekAction`
  (`delete`). Each revalidates `/`, `/groups/reports` and `/groups/[id]` (layout), since one call
  touches every group.
- The dialogs are client components: add `NoMeetingWeek` to `CLIENT_NAMESPACES`, or pass their
  labels from the server parent, as `ReportWeekSection` does for `WeekBrowser`. Note which one in
  *Decisions*.

## Stage 2: Next week on Report status (`/`)

**Files:** `app/(app)/_lib/week-param.ts`, `_components/report-week/week-stepper.tsx`,
`week-title.ts`, `report-week-section.tsx`, `groups-dashboard.tsx`.

- `parseWeekParam(value, today, { weeksAhead = 0 } = {})`: allows up to `weeksAhead` weeks past
  the current one; beyond that → null (current week). Report status passes `weeksAhead: 1`;
  **Prayer & follow-up keeps 0** (its API still refuses future weeks).
- `WeekStepper` gains `lastSunday` (the last week it may step to; default the current Sunday).
  *Next* is disabled on that week, not on the current one.
- `weekTitle` adds **Next week** (`GroupsDashboard.nextWeek`).
- Next week's rows are mostly **Upcoming**; nothing else changes. Needs follow-up is about now and
  ignores the viewed week, as today.

## Stage 3: Mark button and confirm dialog

**Files:** `report-week/report-week-section.tsx`, new `report-week/mark-week-button.tsx` and
`mark-week-dialog.tsx`.

### Button

- In the header's right cluster, before **All reports** and the stepper; it wraps under them at
  390. HeroUI secondary button with `CalendarXIcon` (`components/icons.tsx`).
- Shown only with `can({ smallGroups: ["all"], smallGroupReports: ["create"] })` and when the week
  has at least one group to mark: status `notFiled`, `today`, `upcoming` or `noLeader` with a
  `meetingDate` (rule 5). Hidden when there is none.
- Label: **Mark no meeting for all groups**; when the week already has `noMeetingWeek`,
  **Mark the remaining groups** (rule 6).
- An admin or elder with no linked member (`getMe()`): the button is disabled with the
  `needsMember` text as its description, like **New report** (reports rule 5).

### Dialog (HeroUI `Modal`, like `NoMeetingDialog`)

- Title: the week (**No meeting the week of Nov 1–7?**).
- Counts from the week already loaded (rule 13), no extra call:
  - *toMark*: groups the button counts above;
  - *staying*: groups with status `submitted` or `notHeld`;
  - *noDay*: status `noMeetingDay`.
  Lines with 0 are left out.
- Reason: the same field and `n / 255` counter as `NoMeetingDialog`, optional. **Not shown on a
  re-run** (the reason is edited from the banner); the dialog says the existing reason is used.
- **Mark N groups** (primary) / **Cancel**. While saving, the button shows its spinner and the
  dialog can't close.
- After success: close, `showToast()` with the API's `marked` (**22 groups marked as no meeting**),
  `router.refresh()`. Focus moves to the banner's heading (stage 4); before stage 4 lands, to the
  week heading.
- Failure: the message inside the dialog, which stays open.

## Stage 4: Week banner: edit reason and undo

**Files:** new `report-week/church-wide-banner.tsx`, `edit-week-reason-dialog.tsx`,
`undo-week-dialog.tsx`.

- Between the header and the pills, when `noMeetingWeek` is set. `card()` with the no-meeting
  status dot. Heading **No meetings this week** (or **next week** / **that week** from the same
  rule as `weekTitle`); the reason in quotes, or **No reason given**; a muted line
  **Marked for {count} groups by {name} · {date}**. `count` is `linkedCount`.
- Actions (right on desktop, under the text on a phone): **Edit reason** (needs `update`),
  **Undo** (needs `delete`, danger text button). Hidden without the permission.
- **Edit reason**: the reason field in a small dialog, prefilled; empty saves as no reason.
  Toast **Reason updated**; focus back on **Edit reason**.
- **Undo**: confirm dialog: **Undo the no meeting for {count} groups?** and
  **Groups that filed a report or whose leader changed their mark stay as they are.** Danger
  button **Undo**. After it: toast **Undone**, refresh, focus on the week heading.
- `gone` (404) from either: show the message in the dialog and refresh when it closes.

## Stage 5: Church-wide label and the leader's detach note

**Files:** `groups/reports/_components/no-meeting-detail.tsx`, the Reports list row and phone
card, `groups/[id]/_components/group-reports-card.tsx`, `report-week/week-rows.tsx`,
`no-meeting-dialog.tsx`.

- Wherever a no meeting shows **No meeting**, a report with `noMeetingWeekId` reads
  **No meeting · church-wide** (one key, `NoMeetingWeek.label`). The submitter line stays (it's
  the elder who marked it).
- `NoMeetingDialog` `kind="edit"` on a church-wide report: a muted note under the field,
  **Marked for every group. Changing it only changes this group.** Saving a different reason
  unlinks it (the API does it; nothing to send).
- No change to *Delete* or *File a report instead*: they work as for any no meeting.

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `GroupsDashboard.nextWeek` | Next week | La próxima semana |
| `NoMeetingWeek.markAll` | Mark no meeting for all groups | Marcar sin reunión para todos los grupos |
| `NoMeetingWeek.markRemaining` | Mark the remaining groups | Marcar los grupos que faltan |
| `NoMeetingWeek.dialogTitle` | No meeting the week of {range}? | ¿Sin reunión la semana del {range}? |
| `NoMeetingWeek.toMark` | {count, plural, one {# group will be marked as no meeting.} other {# groups will be marked as no meeting.}} | {count, plural, one {Se marcará # grupo sin reunión.} other {Se marcarán # grupos sin reunión.}} |
| `NoMeetingWeek.staying` | {count, plural, one {# group already has a report or a no meeting and stays as it is.} other {# groups already have a report or a no meeting and stay as they are.}} | {count, plural, one {# grupo ya tiene un reporte o un sin reunión y queda como está.} other {# grupos ya tienen un reporte o un sin reunión y quedan como están.}} |
| `NoMeetingWeek.noDay` | {count, plural, one {# group has no meeting day and is skipped.} other {# groups have no meeting day and are skipped.}} | {count, plural, one {# grupo no tiene día de reunión y se omite.} other {# grupos no tienen día de reunión y se omiten.}} |
| `NoMeetingWeek.reasonLabel` | Reason (optional) | Motivo (opcional) |
| `NoMeetingWeek.reasonPlaceholder` | E.g. church retreat | Ej.: retiro de la iglesia |
| `NoMeetingWeek.usesExistingReason` | The week's reason is used. You can change it after. | Se usa el motivo de la semana. Puedes cambiarlo después. |
| `NoMeetingWeek.confirm` | {count, plural, one {Mark # group} other {Mark # groups}} | {count, plural, one {Marcar # grupo} other {Marcar # grupos}} |
| `NoMeetingWeek.markedToast` | {count, plural, one {# group marked as no meeting} other {# groups marked as no meeting}} | {count, plural, one {# grupo marcado sin reunión} other {# grupos marcados sin reunión}} |
| `NoMeetingWeek.bannerThisWeek` | No meetings this week | Esta semana no hay reuniones |
| `NoMeetingWeek.bannerNextWeek` | No meetings next week | La próxima semana no hay reuniones |
| `NoMeetingWeek.bannerOtherWeek` | No meetings that week | Esa semana no hubo reuniones |
| `NoMeetingWeek.noReason` | No reason given | Sin motivo |
| `NoMeetingWeek.markedBy` | {count, plural, one {Marked for # group by {name} · {date}} other {Marked for # groups by {name} · {date}}} | {count, plural, one {Marcado para # grupo por {name} · {date}} other {Marcado para # grupos por {name} · {date}}} |
| `NoMeetingWeek.editReason` | Edit reason | Editar motivo |
| `NoMeetingWeek.reasonUpdated` | Reason updated | Motivo actualizado |
| `NoMeetingWeek.undo` | Undo | Deshacer |
| `NoMeetingWeek.undoTitle` | {count, plural, one {Undo the no meeting for # group?} other {Undo the no meeting for # groups?}} | {count, plural, one {¿Deshacer el sin reunión de # grupo?} other {¿Deshacer el sin reunión de # grupos?}} |
| `NoMeetingWeek.undoBody` | Groups that filed a report or whose leader changed their mark stay as they are. | Los grupos que enviaron un reporte o cuyo líder cambió su marca quedan como están. |
| `NoMeetingWeek.undoneToast` | Undone | Deshecho |
| `NoMeetingWeek.label` | No meeting · church-wide | Sin reunión · toda la iglesia |
| `NoMeetingWeek.detachNote` | Marked for every group. Changing it only changes this group. | Marcado para todos los grupos. Si lo cambias, solo cambia para este grupo. |
| `NoMeetingWeek.needsMember` | Link your account to a member to mark a week. | Vincula tu cuenta a un miembro para marcar una semana. |
| `NoMeetingWeek.tooFarAhead` | You can mark up to next week. | Puedes marcar hasta la próxima semana. |
| `NoMeetingWeek.gone` | This was already undone. The page will refresh. | Esto ya se deshizo. La página se actualizará. |

## Not in this spec

- Leaders marking their own no meeting ahead of time (the API allows it; the leader flows keep
  today as the latest date).
- Showing leaders an upcoming church-wide no meeting on their dashboard, or notifying them.
- Part of a week, some groups only, weeks after next.
- Recurring cancellations.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; the header wraps cleanly with
      the new button; the banner's actions drop under the text on a phone.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Token changes (if any) are in `tokens/`, `pnpm tokens --check` passes.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] Focus ring visible on every control; focus after mark, edit and undo as described.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] Prayer & follow-up's stepper still stops at the current week.
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
