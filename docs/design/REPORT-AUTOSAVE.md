# Report auto-save: drafts, the save indicator and one editor

Implementation spec for **report auto-save** (Groups ▸ Reports, `/groups/reports/new` and
`/groups/reports/[id]/edit`), which today keeps an unsent new report in `localStorage` only and
has a separate edit form with Save and Cancel:

- every report auto-saves to the server from its first change, with an indicator that always says
  where the latest change is (Saving… · Saved · Saved on this device · Couldn't save);
- a report is a **Draft** until **Submit report** (with a short confirm); submitted reports keep
  auto-saving live, with **Done** instead of Save / Cancel;
- coming back to a draft opens the full list with its progress and **Continue one at a time**;
- leaders see their drafts in My reports, on the leader dashboard (**Continue draft**) and Group
  detail; everyone else sees only **Draft started** on that date in Reports and Report status.

**Decided:** everything in `../docs/specs/report-autosave.md` (rules 1–21). In particular: no Save
button anywhere; submit is one-way; a draft counts as Due / Not filed for elders; leaving keeps
the draft, only **Discard draft** deletes it; conflicts reload, they don't merge.

**Depends on the API:** `membership-management/docs/REPORT-AUTOSAVE-API-HANDOFF.md` stages 1–5,
merged to its `main` (migration head `b7d2c4a91e30`). If something needs an API change that isn't
there yet, say so and stop; stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the **`report-autosave`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each
stage, write a short summary of what changed and anything that differs from the canvas in the
progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Report auto-save"**. Every board is a `ReportForm`, `Reports` or `LeaderDashboard`
  variant; the Tweaks panel shows the props (`kind`, `autosave`, `save`, `dialog`, `seed`,
  `rosterChanged`, `drafts`).
- **Boards:**
  - Row 1, saving: `AutoSave-Person` (saving), `AutoSave-Quick` (saved), `AutoSave-Group-Error`
    (couldn't save), `AutoSave-Offline`, `AutoSave-Conflict`, `AutoSave-Phone-Offline-Dark-ES`,
    `AutoSave-Phone-Person`.
  - Row 2, coming back: `Draft-Resume`, `Draft-Resume-Person`, `Draft-RosterChanged`,
    `Draft-Resume-Phone`, `Draft-Resume-Person-Phone-Dark-ES`.
  - Row 3, dialogs: `Draft-Submit`, `Draft-Discard`, `Draft-NoMeeting`, `Draft-Submit-Phone-ES`,
    `Draft-Discard-Phone-Dark`.
  - Row 4, live edit: `Edit-Live`, `Edit-Live-Elder-Dark-ES`, `Edit-Live-Phone`.
  - Row 5, where drafts show: `Reports-Leader-Drafts`, `LeaderDashboard-Draft`,
    `Reports-Drafts-Elder`, `LeaderDashboard-Elder-Drafts`, `Reports-Leader-Drafts-Phone-Dark-ES`,
    `LeaderDashboard-Draft-Phone`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  as installed on the canvas.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API types, client and server actions | ✅ | 399db51 |
| 2. The save engine (queue, device outbox, status) | ✅ | 353e20b |
| 3. One editor: indicator, pill, banners, Done, Leave, Discard | ✅ | b4c434c |
| 4. New report → draft, resume, Continue one at a time, roster drift | ✅ | 088ada5 |
| 5. Submit, discard and no-meeting dialogs | ✅ | 40d67b4 |
| 6. Lists and dashboards | ✅ | d6471b1 |
| 7. Old browser drafts, clean-up | ✅ | 25fa65a |
| 8. Design review fixes | ✅ | 71eefde |

### Status and what's pending (read this first in a new session)

All eight stages are merged to `main` (PR 96). What is left, in order:

1. **The elder side, untried** (it was meant to happen before merging; it didn't). The first session was signed in only as a small
   group leader. Sign in as an elder (and as a second leader), re-run membership-management's seed
   so GP - #4 and GP - #1 have drafts (`uv run python -m membership_management.cli.main`, see its
   README; the local DB had no drafts when stage 6 was tried), then check:
   - `Reports-Drafts-Elder`: the not-filed row says *Draft started by X*, with no File report or
     No meeting; phone card *No report yet. X has started a draft.*
   - `LeaderDashboard-Elder-Drafts`: *Draft started* (pencil) under due and today rows; status,
     order, counts and Needs follow-up unchanged.
   - A second leader of the same group sees the draft and can continue it; a leader of another
     group gets *A leader has started a draft for this date.* on `/new` for that date, with the mode
     cards dimmed (rule 17).
   - The close-group dialog's *Closing it also discards N unsent drafts* line (needs a group with
     a draft and someone allowed to close it; closing is destructive, use a throwaway group).
2. ✅ **auth-server rate limits** (branch `auth-session-reuse`, its own PR; roadmap Phase 10). The session is now read once per
   request, server actions included (`perRequest` in `api/auth-api/helpers/per-request.ts`, keyed
   on Next's per-request headers object), and a JWT is reused until a minute before it expires,
   keyed by the session, user, role and permissions (`get-auth-token.ts`; a 401 from the API drops
   it). Measured as in stage 8: 8 saves gave 8 `/get-session` calls and no `/token` mint (it was
   16 and 8). Opening a page: one of each.
3. **After staff-app is deployed: membership-management stage 6** (contract): `version` required
   on save and submit, create defaults to `draft`, roster drops `existingReportId` /
   `existingReportHeld`. staff-app already sends `status` and `version` and never reads the old
   roster fields, so it needs no change; confirm against that stage's commit when it lands.
4. **Then: close out the spec.** Tick the API's stage 6, trim `../docs/specs/report-autosave.md`
   to its decisions (members-management repo, its own commit), and trim this file's stage notes
   to what the code doesn't say.

Smaller follow-ups, none blocking:

- **Tests:** no runner yet. When Vitest lands, add `report-autosave.test.ts` for the
  `ReportAutosave` class (coalescing, one save in flight, typing vs. blur, offline then online,
  conflict keeping the device copy, retry backoff, create-then-rekey, roster drift, `canSend`
  holding a submitted report). The class takes `save`, `create` and `isOnline` as options, so it
  needs no React or network.
- **Done scroll:** after **Done** the report detail sometimes keeps the editor's scroll position
  instead of starting at the top.
- **Phone sheet:** the confirm dialogs' bottom sheet keeps HeroUI's side margins rather than
  running edge to edge as on the canvas.
- **Local data from the first session:** draft 81 (Nuevos Comienzos, Oct 23) is an old browser
  draft migrated by stage 7, with test answers on top; discard it if unwanted. Report 52 was edited
  and put back (its version went up).

Where things live (for a new session):

- Save engine and hook: `app/(app)/groups/reports/_lib/report-autosave.ts` (`ReportAutosave`,
  `useReportAutosave`, device outbox `ekk-report-outbox:{id}` / `ekk-report-outbox:new:{group}:{date}`).
- Form ↔ API body: `_lib/report-form.ts` (`ReportDraft` types, `formFromReport`, `toReportBody`).
- Old browser drafts (migration only): `_lib/legacy-report-draft.ts`.
- The one editor: `_components/report-flow.tsx` (new, draft and submitted), with
  `save-status.tsx`, `report-banner.tsx`, `resume-card.tsx`, `report-confirm-dialog.tsx`.
- Server actions: `_actions/report-actions.ts` (`createReportAction`, `saveReportAction`,
  `submitReportAction`, `leaveReportAction`, `deleteReportAction`, `markNoMeeting`).
- Error kinds (status + `detail` phrase): `lib/api-error-message.ts`.

### Decisions and deviations

- Stage 1: the API differs from this doc in a few places (from its handoff's "Decisions and
  deviations"): 409s with extra fields also carry a `code`, still matched on the `detail` phrase;
  the list has no not-filed row for a meeting whose draft the caller sees, and `notFiled` excludes
  it (the summary's `notFiledDates` keeps the date); submit can answer 422 `attendance`;
  `existingReport` of a submitted report also has `version`. Types follow the API's commits
  2c8db35 and 173c3c5. The roster's old `existingReportId` / `existingReportHeld` are left out of
  the type (they go in the API's stage 6), so nothing reads them.
- Stage 1: `saveReportAction` doesn't revalidate. A server action that revalidates re-renders the
  open page on the server, which for auto-save would be one page render (session, JWT, report,
  roster) per save. Leaving the editor (`leaveReportAction`, submit, discard) revalidates instead.
- Stage 1: failures that a retry may fix (the API unreachable, 5xx, 429) come back as `kind:
  "network"`; the engine retries them. A redirect from the session check is rethrown.
- Stage 1: `SubmittedReportDetail` (via `isSubmitted`) types a submitted report's answers as
  booleans, so the read views (detail, no meeting, prayer panel) don't handle nulls they can't
  get. A draft's `/groups/reports/[id]` redirects to `/edit` from this stage on.
- Stage 2: `ReportAutosave` (class) + `useReportAutosave` (hook) in `_lib/report-autosave.ts`. No
  test runner yet, so it was exercised with a throwaway script against fake saves (coalescing, one
  in flight, typing vs. blur, offline then online, conflict keeping the device copy, retry after
  2 s, create-then-rekey, roster drift); the browser checks (DevTools offline and throttled) are in
  stage 3, once the editor uses it. Worth a `report-autosave.test.ts` when Vitest lands.
- Stage 2: the device copy is written on every change (rule 8), not only before each send. It
  holds the editor's own state next to the body, so tagged people keep their names on restore.
- Stage 2: a failure that a retry won't fix (date taken, too many items) shows *Couldn't save*
  without automatic retries; the next change or Retry sends again. `flush()` (for submit) resolves
  null on any failure instead of waiting through retries.
- Stage 2: leaving the editor sends a change still waiting for its timer at once instead of
  leaving it on the device. `report-draft.ts` stays until stage 7 (the browser-draft migration).
- Stage 3: tried in the browser on a submitted report (leader, 1440 and 390, light and dark, EN and
  ES): tap → *Saving…* → *Saved · time*; typing waits for the pause and a blur sends at once; a
  second tab on an older version gets the conflict banner, and Reload shows the other change and
  drops the device copy; offline (faked `navigator.onLine` + `offline` event, since the extension
  can't switch DevTools' network) keeps the change on the device, `beforeunload` warns, and a
  reload restores and sends it.
- Stage 3: a submitted report can't be saved with someone unanswered (rule 5), which happens when
  its date or roster changes. The change then waits on the device and the status reads *Not
  saved · answer everyone* (`saveHeld`, not on the canvas); it goes out once everyone is answered.
- Stage 3: Submit and Discard act at once here; their confirm dialogs come in stage 5. A draft
  opens on the list with the same date and place card as a submitted report until stage 4 adds
  the resume card.
- Stage 3: Report detail's subtitle adds *Last edited by X · time* (rule 10). The conflict copy has
  a no-name variant for an edit by an admin with no member.
- Stage 3: `StaffAppPageHeader` gained `breadcrumbAside` and `titleAside` slots for the save status
  and the pill.
- Stage 4: after the first save, `/new` moves to `/groups/reports/{id}/edit` with
  `window.history.replaceState`, not `router.replace`: the two are different routes, so a router
  navigation remounts the editor and loses the step. For the same reason creating a draft doesn't
  revalidate (it re-rendered the page under its new address). A reload then opens `/edit`.
- Stage 4: the first change is choosing the mode, an address edit or an answer; a no meeting (and
  its reason) never starts a draft (rule 1). Before the draft exists, its device copy is keyed by
  group and date and follows a group or date change.
- Stage 4: opening a draft compares its rows with the roster for its date: when they differ it
  shows the roster notice and saves the new list at once, instead of waiting for a 422 on the
  next save. The resume card's "can continue it too" lists first names, as on the canvas.
- Stage 4: a reopened draft's meeting step (*Change date or place*) keeps the met question and
  shows **Back to the list** instead of the mode cards (rule 12). The group can't change once the
  draft exists.
- Stage 4: tried as a leader in the browser (1440, 390; light, dark; EN, ES): mode choice creates
  the draft and stays on the quick list, reload opens the resume card with the progress,
  *Continue one at a time* starts at the first half-answered person with the banner. Not tried:
  someone else's draft on the date (needs a second leader's sign-in); the code path is the
  stage 1 date note.
- Stage 5: one `ReportConfirmDialog` (HeroUI `AlertDialog`, `placement="auto"`: centred 500 px on
  desktop, bottom sheet on phones with the action on top) serves submit, discard and the
  no-meeting replace. The phone sheet keeps HeroUI's side margins rather than running edge to edge.
- Stage 5: the discard body names the other people who see the draft from the roster's leaders
  and co-leaders plus whoever started it (the viewer left out); with nobody else it drops that
  sentence (`discardBodyAlone`).
- Stage 5: tried in the browser (dark, ES; 1440 and 390): discard sheet with focus on *Keep
  draft*; submit with the three tiles, then the report with the *submitted* toast; a draft
  replaced by a no meeting after the confirm. The test reports were deleted afterwards. The close
  group line wasn't tried (it would close a group).
- Stage 6: the API never lists a not-filed row next to a draft row the caller sees, so a leader's
  draft is only its draft row (with **Continue**) everywhere; no list offers *No meeting* on a
  date that holds the caller's draft. The stage 5 change that let the dashboard's No meeting
  dialog replace a draft had no caller, so it was taken out again; replacing a draft with a no
  meeting happens in the editor.
- Stage 6: the leader dashboard drops the draft's date from the card's not-filed lines (the
  summary keeps it in `notFiledDates`) and shows the draft line there instead. *Draft* is a status
  chip only while the caller has drafts (or the filter is on).
- Stage 6: someone else's draft: Reports' not-filed row adds *Draft started by X* (narrow: *Not
  filed · draft started*), the phone card says *No report yet. X has started a draft.*, and none
  of them, nor Group detail, offers File report or No meeting (rule 17).
- Stage 6: tried as a leader (1440, 390; dark; ES): My reports row and card, the Draft chip, the
  dashboard card, Group detail's Recent meetings, discard and its toast. Not tried: the elder
  views (`Reports-Drafts-Elder`, `LeaderDashboard-Elder-Drafts`), which need an elder's sign-in;
  the local DB also had no drafts from the seed (it hadn't been re-run), so there was no other
  leader's draft to show.
- Stage 7: `report-draft.ts` is gone. Its form types (`ReportDraft`, `ReportDraftAnswer`) moved to
  `report-form.ts`; its reader is `legacy-report-draft.ts`, which only the migration uses (the
  one place `ekk-report-draft` still appears). `report-body.ts` and `updateReportAction` are gone.
- Stage 7: the migration runs when the new-report screen has the roster for a group and date
  (on load and after each change). An old entry for a date with no report becomes the draft and
  the editor opens on its list; a date that has a report or draft only loses the entry. The same
  step restores a change kept on the device while a new draft couldn't be created (offline).
- Stage 7: tried with a real old entry in this browser (`ekk-report-draft:7:2026-10-23`): it became
  draft 81 with its answer and address, and the entry was removed. That draft is still there.
- Stage 8 (review): no color literals or new `dark:` overrides in the changed files; every status
  is a dot and a word; the save status is a polite live region and conflict and error banners are
  alerts; the global gold halo covers the plain text buttons. Checked the error state at 1024 in
  light (API stopped): pill with Retry, alert banner, and it saved by itself once the API was back.
  Fixed: a server action that throws on the server (an auth-server 429, say) showed *Saved on
  this device*; it now shows *Couldn't save* and keeps retrying. Dialogs were widened to 500 px
  and the submit tiles got a visible box in dark.
- Stage 8, rate limits (measured with a temporary log in `getSession` / `getToken`, removed): 16
  taps 400 ms apart gave 16 PATCHes, 32 `/get-session` and 16 `/token` calls. Each auto-save is a
  server action that reads the session twice (`forbiddenUnless`, then `authenticatedFetch`'s
  `requireStaffSession`; `cache()` doesn't dedupe inside a server action) and mints one JWT.
  - API PATCH (120/minute per user): fine. Taps 300 ms apart coalesce, so even a fast leader stays
    near 40 saves for a 20-person roster.
  - auth-server `/get-session` and `/token` (300 per IP and path, reset only after 10 s with no
    allowed request): one report is now roughly 2 × saves session reads instead of 2. A leader on
    a 40-person roster, or a few leaders on the same church Wi-Fi filling reports together, can
    pass 300 without a 10 s pause and get 429s. The editor then shows *Couldn't save* and retries
    (2, 5, 15, 30 s); the 15 s wait lets the window reset, so nothing is lost, but it can recur.
  - Fixed afterwards (pending item 2): one session read per save and usually no mint.

## Token changes

None. Draft uses the existing `accentSoft` pair (blue: in progress); Not filed / Due keep the warn
pair (amber); Submitted uses the ok pair. Error and conflict use the danger pair; the canvas's
`dangerBg` (`#FDECEA` light, `rgba(253,162,155,0.12)` dark) must map to an existing danger-soft
token. If none exists, that is the one token to add, in stage 1.

## The API

New and changed shapes are in the API handoff ("Shapes"); update `api/small-groups-api` types to
match. Server actions in `groups/reports/_actions/report-actions.ts`:

| Action | Route | Notes |
| --- | --- | --- |
| `createReportAction(groupId, body)` | `POST /small-groups/{id}/reports` | Now sends `status: "draft"`; returns `{ id, version }` |
| `saveReportAction(id, version, body)` | `PATCH /small-group-reports/{id}` | Replaces `updateReportAction`; returns `{ version, lastEditedAt }` or a typed failure |
| `submitReportAction(id, version)` | `POST /small-group-reports/{id}/submit` | **New** |
| `deleteReportAction(id)` | `DELETE` | Unchanged; also the discard |
| `markNoMeeting(groupId, date, reason, { replacesDraft })` | `POST` (no meeting) | Gains `replacesDraft` |

Failures the editor tells apart (status + `detail` phrase, never shown raw): `conflict`
(409 `changed since`, carries `lastEditedBy`, `lastEditedAt`), `draftInProgress` (409), `closed`,
`incomplete` (422), `attendance` (422: reload the roster), `network` (fetch failed or 5xx),
`linkMember`, `notLeader`. Keep the existing `DATE_FAILURES` handling.

## Stage 2: The save engine

**Files:** `groups/reports/_lib/report-autosave.ts` (new, client), replacing `report-draft.ts`.

One hook, `useReportAutosave({ reportId, version, toBody })`, owns everything below, so the
editor only calls `change(patch, { kind: "tap" | "text" | "blur" })`:

- **State machine** for the indicator: `saved` → `saving` → `saved` | `offline` | `error` |
  `conflict`. `saved` carries `savedAt` for "Saved · 7:48 PM".
- **Queue:** at most one request in flight. Changes that arrive meanwhile mark the report dirty;
  when the request returns, one more save goes out with the latest snapshot. Never two PATCHes at
  once (versions would collide with yourself).
- **Timing:** taps flush after ~300 ms (coalesces quick taps); text flushes 3 s after the last
  keystroke and immediately on blur. Constants in one place.
- **Device outbox:** before each send, write `{ reportId, baseVersion, body, changedAt }` to
  `localStorage` key `ekk-report-outbox:{reportId}` (try/catch; the engine works without storage).
  Clear it when the server confirms that body. A brand-new report has no id yet: key the outbox
  `ekk-report-outbox:new:{groupId}:{date}` until the create returns, then move it.
- **Offline:** a failed fetch (or `navigator.onLine === false`) sets `offline`; retry with backoff
  (2 s, 5 s, 15 s, 30 s, then every 30 s) and immediately on the `online` event. A 5xx is `error`
  with the same retries and a Retry button.
- **Conflict:** a 409 `changed since` stops the queue and sets `conflict`. The device copy is kept
  until the user presses **Reload** (then it is dropped, as the banner says). No merge.
- **On open:** if an outbox exists for this report with `baseVersion` equal to the server's
  `version`, send it (the leader lost the connection or closed the tab before it synced). If the
  server version moved, show the conflict banner.
- **Leaving:** `beforeunload` warns only while the outbox has an unsent change.
- **Roster drift:** a 422 `attendance` refetches the roster, adds new people unanswered, drops the
  ones gone, sets `rosterChanged` for the notice, and saves again.

Write it so it can be tested without React: a plain class or reducer plus a thin hook. Add a short
`report-autosave.test.ts` if the repo has a test runner by then; otherwise exercise it in the
browser with the network throttled and offline (DevTools) and note it in the log.

## Stage 3: One editor (`/groups/reports/[id]/edit`)

**Files:** `groups/reports/[id]/edit/page.tsx`, `_components/report-flow.tsx` (becomes the only
editor), delete `_components/edit-report-form.tsx`, new `_components/save-status.tsx`,
`_components/report-banner.tsx`.

- The editor takes the loaded report (`status`, `version`, answers that may be null) and renders the
  list view for a submitted report and for a resumed draft; the guided steps stay as they are.
- **Save status** (`SaveStatus`): desktop, at the right of the breadcrumb row as a pill with icon and
  long text (`AutoSave-Quick`); phone, a chip in the top bar right side with the short text, and
  the step counter moves into the subtitle (`AutoSave-Phone-Person`). `role="status"`,
  `aria-live="polite"`; the phone chip has the long text as its accessible name. Error adds a
  **Retry** link next to it.
- **Pill** next to the H1: **Draft** (accent-soft, hollow dot) or **Submitted** (ok, filled dot);
  hidden on the meeting step of a brand-new report. Phone: the word leads the subtitle.
- **Banner** (`ReportBanner`) above the content, one at a time, in this order: conflict, error,
  offline, roster changed, resumed-at-person. Width matches the step's column. Conflict and error
  are `role="alert"` with an action button (Reload / Try again).
- **Footer:** draft: **Discard draft** (danger text button, left), the hint, **Submit report**
  (disabled until everyone is answered, same hint as today). Submitted: the hint *Changes save as
  you go and show right away.* and **Done** (back to the report). The meeting step's Cancel becomes
  **Back to My reports** and keeps the draft.
- **Submitted meta line:** *Submitted by X on … · Last edited by Y today at …* (`Edit-Live`).
- **Rows** with one answer missing show *Church on Sunday not answered* / *Group meeting not
  answered* in the warn color under the name, outside the review step (`Draft-Resume`).
- `/groups/reports/[id]` for a draft redirects to `/edit` (a draft has no read view).

## Stage 4: New report → draft, resume

**Files:** `new/page.tsx`, `report-flow.tsx`, `_components/resume-card.tsx`.

- `/new` works as today until the **first change** after group and date (an address edit, the mode
  choice, or the first answer). That change calls `createReportAction` with `status: "draft"`, then
  `router.replace('/groups/reports/{id}/edit')` keeping the current step in client state. A reload
  from then on resumes the server draft.
- Picking a date whose roster reports `existingReport.status === "draft"` with an id opens that
  draft (no error). Without an id (someone else's draft): the date error *A leader has started a
  draft for this date* and the mode cards dim, like the duplicate-date state today.
- **Resume card** on top of the list for a draft (`Draft-Resume`): eyebrow *Draft*, title *Pick up
  where you left off*, who started it and when, last saved, who else can continue it; progress line
  *{n} of {total} people answered* / *{k} to go* (or *All answered*); the 8-segment bar; **Continue
  one at a time** (or **Go through one at a time** when nothing is missing) with its hint; footer
  row with the date, the place and **Change date or place** (back to the meeting step with the
  duplicate-date check).
- **Continue one at a time** jumps to the first person with either answer missing (the existing
  `firstOpen` logic, now checking both answers) and shows the *Picking up where you left off*
  banner there (`Draft-Resume-Person`).

## Stage 5: Dialogs

**Files:** `_components/submit-report-dialog.tsx`, `_components/discard-draft-dialog.tsx`, extend
`no-meeting-card.tsx` / `no-meeting-dialog.tsx`.

- HeroUI modal on desktop (centred, 500 px), bottom sheet on phone (buttons stacked, primary on
  top). Focus goes to the safe button (Keep editing / Keep draft); Escape closes; focus returns to
  the trigger.
- **Submit** (`Draft-Submit`): send icon, title, the elders-will-see body, three tiles (people
  answered, came, notes), **Keep editing** / **Submit report**. On success go to the report detail
  with the existing *submitted* toast. A save still in flight is flushed first; submit uses the
  version it returns.
- **Discard** (`Draft-Discard`): trash icon in danger-soft, body names the date and what is lost
  (answered count, notes), **Keep draft** / **Discard draft** (danger). Goes to My reports with a
  *Draft discarded* toast.
- **No meeting on a date with a draft** (`Draft-NoMeeting`): saving the no meeting first asks
  *Replace the draft with no meeting?*; the confirm sends `replacesDraft: true`.
- **Close group** dialog (Group detail): when `draftCount > 0`, add *Closing it also discards {n}
  unsent draft(s).*

## Stage 6: Lists and dashboards

**Files:** `_components/reports-table.tsx`, `reports-list.tsx`, `report-card.tsx`,
`reports-browser.tsx`, the dashboard components (leader *My groups* card, Report status week
table and cards), Group detail's Recent meetings card.

- **My reports (leaders)** (`Reports-Leader-Drafts`): a draft row shows the blue **Draft** pill and
  *Started by X · n of m answered* in the Submitted-by column, `—` for the numbers, and a primary
  **Continue** button; a **Draft** status chip with its count. Phone card: Draft badge, the same line,
  **Continue**.
- **Reports (everyone else)** (`Reports-Drafts-Elder`): the not-filed row keeps **Not filed** and
  adds *Draft started by X* under it; **File report** and **No meeting** are hidden on that row
  (rule 17). Narrow widths: *Not filed · draft started*.
- **Leader dashboard** (`LeaderDashboard-Draft`): the group card shows a blue line *Draft for
  today's meeting · n of m answered · saved {time}* (or the draft's date when it isn't today) and
  its primary button becomes **Continue draft**.
- **Report status (elders)** (`LeaderDashboard-Elder-Drafts`): `due` / `today` rows with `hasDraft`
  add *Draft started* with the pencil icon under the date. Status, order, counts and Needs
  follow-up don't change.
- **Group detail ▸ Recent meetings:** a draft the viewer sees shows as *Draft · Continue*; for
  others the date stays not filed with *Draft started*.

## Stage 7: Old browser drafts, clean-up

- On `/new` for a group and date with an `ekk-report-draft:{group}:{date}` entry and no server
  draft: create the server draft from it once (answers, address, items), remove the entry, open the
  editor. If the date already has a server draft, remove the entry without using it.
- Delete `report-draft.ts` and its callers; keep `report-items-draft.ts` (the item model).
- Remove `updateReportAction` and `EditReportForm` imports; grep for `ekk-report-draft` and leave
  only the migration.

## Copy

All new UI text, both languages (see "Adding UI text" in `CLAUDE.md`). Namespace `ReportForm`
unless noted. Names, times and counts are ICU arguments.

| Namespace.key | English | Español |
| --- | --- | --- |
| `draftPill` | Draft | Borrador |
| `submittedPill` | Submitted | Enviado |
| `saveSaving` | Saving… | Guardando… |
| `saveSavedDraft` | Draft saved · {time} | Borrador guardado · {time} |
| `saveSaved` | Saved · {time} | Guardado · {time} |
| `saveOffline` | Saved on this device · will sync | Guardado en este dispositivo · se sincronizará |
| `saveError` | Couldn’t save | No se pudo guardar |
| `saveConflict` | Not saved: {name} changed it | Sin guardar: {name} hizo cambios |
| `saveShortSaved` | Saved | Guardado |
| `saveShortOffline` | Offline | Sin conexión |
| `saveShortError` | Not saved | Sin guardar |
| `retry` | Retry | Reintentar |
| `retryNow` | Try again | Intentar de nuevo |
| `reload` | Reload | Recargar |
| `offlineTitle` | You’re offline. | Estás sin conexión. |
| `offlineBody` | Keep going: each change is kept on this device and saved to the report as soon as you’re back online. | Puedes seguir: cada cambio se guarda en este dispositivo y pasa al reporte en cuanto vuelvas a tener conexión. |
| `errorTitle` | Your last change wasn’t saved yet. | Tu último cambio aún no se guardó. |
| `errorBody` | It’s kept on this device and we’ll keep trying, so you can carry on. | Está guardado en este dispositivo y seguiremos intentando, así que puedes continuar. |
| `conflictTitle` | {name} changed this report a moment ago. | {name} cambió este reporte hace un momento. |
| `conflictBody` | Reload to see the changes. Your last change wasn’t saved, so make it again after reloading. | Recarga para ver los cambios. Tu último cambio no se guardó; vuelve a hacerlo después de recargar. |
| `rosterTitle` | The list changed since this draft was started. | La lista cambió desde que empezó este borrador. |
| `rosterAdded` | {names} {count, plural, one {is} other {are}} on the list now. Mark them too. | {names} ahora {count, plural, one {aparece} other {aparecen}} en la lista. Márcalos también. |
| `resumedTitle` | Picking up where you left off. | Sigues donde lo dejaste. |
| `resumedBody` | {name} is the first person with something left to answer. | {name} es la primera persona con algo pendiente. |
| `resumeEyebrow` | Draft | Borrador |
| `resumeTitle` | Pick up where you left off | Sigue donde lo dejaste |
| `resumeBy` | {name} started this draft on {date} at {time}. Last saved at {saved}. | {name} empezó este borrador el {date} a las {time}. Guardado por última vez a las {saved}. |
| `resumeOthers` | {names} can continue it too. | {names} también pueden continuarlo. |
| `resumeAnswered` | of {total} people answered | de {total} personas respondidas |
| `resumeLeft` | {count} to go | {count, plural, one {falta 1} other {faltan #}} |
| `resumeAllAnswered` | All answered | Todo respondido |
| `continueGuided` | Continue one at a time | Continuar una persona a la vez |
| `reviewGuided` | Go through one at a time | Repasar una persona a la vez |
| `continueHint` | Starts at {name}, the first person with something left to answer. | Empieza con {name}, la primera persona con algo pendiente. |
| `reviewHint` | Everyone is answered. Starts at the first person, for adding notes. | Todas las personas están respondidas. Empieza con la primera, para agregar notas. |
| `changeMeeting` | Change date or place | Cambiar fecha o lugar |
| `meetingOpen` | Group meeting not answered | Falta la reunión del grupo |
| `churchOpen` | Church on Sunday not answered | Falta la iglesia el domingo |
| `discard` | Discard draft | Descartar borrador |
| `leave` | Back to My reports | Volver a Mis reportes |
| `done` | Done | Listo |
| `liveHint` | Changes save as you go and show right away. | Los cambios se guardan mientras editas y se ven de inmediato. |
| `lastEdited` | Last edited by {name} {when} | Última edición de {name} {when} |
| `submitTitle` | Submit this report? | ¿Enviar este reporte? |
| `submitBody` | The elders will see it on Report status, in Prayer & follow-up and on each person’s timeline. You can still edit it afterwards; changes show right away. | Los ancianos lo verán en Estado de reportes, en Oración y seguimiento y en el historial de cada persona. Puedes seguir editándolo después; los cambios se ven de inmediato. |
| `keepEditing` | Keep editing | Seguir editando |
| `sumAnswered` / `sumCame` / `sumNotes` | People answered / Came / Notes | Personas respondidas / Vinieron / Notas |
| `discardTitle` | Discard this draft? | ¿Descartar este borrador? |
| `discardBody` | Everything in the {date} draft is deleted: {answered} of {total} people answered{notes, plural, =0 {} one {, 1 note} other {, # notes}}. {others} won’t see it either. This can’t be undone. | Se borra todo lo del borrador del {date}: {answered} de {total} personas respondidas{notes, plural, =0 {} one {, 1 nota} other {, # notas}}. {others} tampoco lo verán. No se puede deshacer. |
| `keepDraft` | Keep draft | Conservar borrador |
| `nmDraftTitle` | Replace the draft with no meeting? | ¿Reemplazar el borrador con sin reunión? |
| `nmDraftBody` | You started a report for {date} ({answered} of {total} people answered). Saving the date as no meeting deletes that draft. | Empezaste un reporte para el {date} ({answered} de {total} personas respondidas). Guardar la fecha sin reunión borra ese borrador. |
| `nmKeep` / `nmConfirm` | Keep the draft / Delete draft and save | Conservar el borrador / Borrar borrador y guardar |
| `draftInProgress` | A leader has started a draft for this date. | Un líder ya empezó un borrador para esta fecha. |
| `Reports.draft` | Draft | Borrador |
| `Reports.continue` | Continue | Continuar |
| `Reports.startedBy` | Started by {name} · {answered} of {total} answered | Empezado por {name} · {answered} de {total} respondidas |
| `Reports.draftStartedBy` | Draft started by {name} | Borrador empezado por {name} |
| `Reports.draftDiscarded` | Draft discarded | Borrador descartado |
| `Dashboard.draftLine` | Draft for {date} · {answered} of {total} answered · saved {time} | Borrador del {date} · {answered} de {total} respondidas · guardado {time} |
| `Dashboard.draftToday` | Draft for today’s meeting · {answered} of {total} answered · saved {time} | Borrador de la reunión de hoy · {answered} de {total} respondidas · guardado {time} |
| `Dashboard.continueDraft` | Continue draft | Continuar borrador |
| `Dashboard.draftStarted` | Draft started | Borrador empezado |
| `Groups.closeDiscardsDrafts` | Closing it also discards {count, plural, one {1 unsent draft} other {# unsent drafts}}. | Cerrarlo también descarta {count, plural, one {1 borrador sin enviar} other {# borradores sin enviar}}. |

## Not in this spec

- The submit email (API later; the Submit dialog copy changes then).
- Live presence, merging simultaneous edits, report edit history.
- Drafts for future dates; expiring old drafts.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; list pages switch table → cards
      below `md`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] Focus ring visible on every control; focus after each dialog makes sense; the save status is
      announced politely, the conflict and error banners assertively.
- [ ] Throttled and offline (DevTools): changes keep the *Saved on this device* state, sync when
      back online, nothing is lost on reload, and `beforeunload` only warns with unsent changes.
- [ ] Two browsers on the same draft: the second save gets the conflict banner, Reload shows the
      first person's change.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
