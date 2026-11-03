# Report auto-save: drafts, the save indicator and one editor

Implementation spec for **report auto-save** (Groups ▸ Reports, `/groups/reports/new` and
`/groups/reports/[id]/edit`), which replaced an unsent new report kept in `localStorage` only and a
separate edit form with Save and Cancel:

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

### Status

**Done** (2026-11-03). Stages 1–8 merged in PR 96 and in production since staff-app `7d7838c`
(with the API's stages 1–5). Afterwards: the elder views were checked in the browser, the session
read and API token reuse cut auth-server calls per save (PR 97), the no-meeting reason edit started
sending `version` (PR 99, `ac8f10a`), and the API's stage 6 contract went live (`beb61eb`). The
cross-repo spec is trimmed to its decisions. Copy lives in `messages/`, tokens didn't change (Draft
uses the `accentSoft` pair).

Follow-ups, none blocking:

- **Not tried:** a second leader continuing another leader's draft (GP - #1's leader and co-leader
  both have a sign-in locally: *Luis Zeta*, *Luis Zeta 3*).
- **Tests:** no runner yet. When Vitest lands, add `report-autosave.test.ts` for the
  `ReportAutosave` class (coalescing, one save in flight, typing vs. blur, offline then online,
  conflict keeping the device copy, retry backoff, create-then-rekey, roster drift, `canSend`
  holding a submitted report). The class takes `save`, `create` and `isOnline` as options, so it
  needs no React or network.
- **Done scroll:** after **Done** the report detail sometimes keeps the editor's scroll position
  instead of starting at the top.
- **Phone sheet:** the confirm dialogs' bottom sheet keeps HeroUI's side margins rather than
  running edge to edge as on the canvas.
- **Off-day drafts are invisible to others** (decide; API): only the group's expected meeting dates
  get a not-filed row, and `/new` allows any past date. A draft on an off day shows nowhere for
  elders or other viewers until it is submitted, so rule 15's *Draft started* has no row to go on.
  If it matters, the API's list would add a row for someone else's draft on a date with no
  expected meeting.
- **Types:** `version` is still optional in `ReportInput` / `NoMeetingInput`
  (`api/small-groups-api/types.ts`) because create shares them; the API requires it on a save.
- **Local test data:** draft 81 (Nuevos Comienzos, Oct 23) and draft 82 (GP - #5, Oct 31, started
  as *Luis Reyes*) are test drafts; discard them if unwanted.

### Where things live

- Save engine and hook: `app/(app)/groups/reports/_lib/report-autosave.ts` (`ReportAutosave`,
  `useReportAutosave`, device outbox `ekk-report-outbox:{id}` / `ekk-report-outbox:new:{group}:{date}`).
- Form ↔ API body: `_lib/report-form.ts` (`ReportDraft` types, `formFromReport`, `toReportBody`).
- Old browser drafts (migration only): `_lib/legacy-report-draft.ts`.
- The one editor: `_components/report-flow.tsx` (new, draft and submitted), with
  `save-status.tsx`, `report-banner.tsx`, `resume-card.tsx`, `report-confirm-dialog.tsx`.
- Server actions: `_actions/report-actions.ts` (`createReportAction`, `saveReportAction`,
  `submitReportAction`, `leaveReportAction`, `deleteReportAction`, `markNoMeeting`).
- Error kinds (status + `detail` phrase): `lib/api-error-message.ts`.

### Decisions the code doesn't explain

- **Saves don't revalidate.** A server action that revalidates re-renders the open page on the
  server: one page render (session, JWT, report, roster) per save. Leaving the editor (Done, Back
  to My reports, submit, discard) revalidates instead. Creating the draft doesn't revalidate
  either: `/new` moves to `/groups/reports/{id}/edit` with `window.history.replaceState`, not
  `router.replace`, because a router navigation between the two routes remounts the editor and
  loses the step.
- **The first change** is choosing the mode, an address edit or an answer; a no meeting never
  starts a draft (rule 1). Until the draft exists its device copy is keyed by group and date.
- **Retries:** failures a retry may fix (API unreachable, 5xx, 429, a server action that throws)
  come back as `kind: "network"` and retry at 2, 5, 15, 30 s; others show *Couldn't save* until the
  next change or Retry. `flush()` (for submit) resolves null on any failure instead of waiting.
- **The device copy** is written on every change (rule 8), not only before a send, and holds the
  editor's own state, so tagged people keep their names on restore.
- **A submitted report with someone unanswered** (its date or roster changed) can't be saved
  (rule 5): the change waits on the device and the status reads *Not saved · answer everyone*
  (`saveHeld`, not on the canvas).
- **Roster drift** is checked when a draft opens, not only on a 422: the notice shows and the new
  list is saved at once.
- **Lists:** the API never lists a not-filed row next to a draft row the caller sees, so a leader's
  draft is only its draft row (**Continue**), and no list offers *No meeting* on that date;
  replacing a draft with a no meeting happens in the editor. Someone else's draft adds *Draft
  started by X* and hides File report and No meeting (rule 17).
- **Conflicts outside the editor:** the no-meeting reason dialog sends the report's version; a 409
  locks the field and turns Save into **Reload** (PR 99).
- **Auth-server load:** each save reads the session once per request (`perRequest`) and reuses the
  API token until a minute before expiry (`get-auth-token.ts`, PR 97). Before that, 16 saves cost
  32 `/get-session` and 16 `/token` calls, enough to reach auth-server's 300-per-IP limit on a
  big roster or a shared church Wi-Fi.
- **API differences from the original shapes** (from its handoff): 409s with extra fields also
  carry a `code` (still matched on the `detail` phrase); submit can answer 422 `attendance`;
  `existingReport` of a submitted report also has `version`.

## Not in this spec

- The submit email (API later; the Submit dialog copy changes then).
- Live presence, merging simultaneous edits, report edit history.
- Drafts for future dates; expiring old drafts.
