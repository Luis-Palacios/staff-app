# Inactive guests and status on the timeline

Implementation spec for **inactive guests** (Guests, `/guests` and `/guests/[id]`; Group detail,
`/groups/[id]`; the report form's *Someone new came*) and **status changes on the person timeline**
(`/members/[id]`, `/guests/[id]` and their `/timeline` tabs), which are new:

- **Guests list:** tabs *Active* / *Inactive* / *All* with counts, replacing *In a group* / *Not in a
  group* / *All*. A *Left* and a *Last group* column on the Inactive tab, an *Inactive* badge on All.
- **Guest detail, active:** a *Mark as inactive* danger section (admins and elders). Its dialog
  takes the reason, the date they left and a note, and lists what will happen.
- **Guest detail, inactive:** the *Inactive* pill, *Inactive since*, a banner with *Reactivate…*,
  the group history's *Ended when marked inactive*, and *Status history*.
- **Reactivate dialog** on Guest detail: an optional note.
- **Add a guest** and **Someone new came:** an inactive guest shows in search with the *Inactive*
  pill; picking one shows the reactivate note and *Reactivate and add*.
- **Timeline and Recent activity:** *Marked inactive* and *Reactivated* entries among the report
  rows, for members and guests.

**Decided:** everything in the cross-repo spec `../../../docs/specs/inactive-guests.md` (workspace
folder `members-management/docs/specs/`), referred to as *rule N*. The main ones:

- A guest's status is separate from being in a group (rule 1). *Not in a group* is no longer a tab.
- Only `guests: deactivate` marks a guest inactive or sees reason, note and history on Guest detail.
  `guests: reactivate` (leaders too) brings one back (rule 4).
- Leaders reactivate only through *Reactivate and add*, one API call (rule 6).
- Everyone who can open a timeline sees its status entries, reason and note included (rule 13).
- The timeline is a list of typed entries; **skip any `kind` this app doesn't know** (rule 15).

**Depends on the API:** `membership-management/docs/INACTIVE-GUESTS-API-HANDOFF.md`, stages 1–4, and
auth-server stage 1 (`guests: deactivate`, `guests: reactivate`). Stage 4 here needs API stage 4
(`entries`); API stage 5 (dropping `rows`) waits for stage 4 here to be deployed. If a stage starts
before the API is ready, note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the **`inactive-guests`**
branch. Before the next stage starts, each stage must:
- lint (`pnpm lint`) and type-check (`pnpm exec tsc --noEmit`);
- work in light and dark, at 1440 / 1024 / 390, in English and Spanish.

After each stage, write a short summary of what changed, and anything that differs from the canvas,
in the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1).
  Each row's blue rules note matches the spec.
  - Page "Guests", row *Inactive guests · leaving and coming back*.
  - Page "Tagging people", row *Status on the timeline*.
- **Boards:**
  - `Guests-Inactive` (Inactive tab), `Guests-All` (All tab), `Guests` (Active tab),
    `Guests-Inactive-Dark-ES`
  - `GuestDetail-Deactivate` (dialog), `GuestDetail-Inactive`, `GuestDetail-Inactive-Dark-ES`,
    `GuestDetail-Reactivate` (dialog), `GuestDetail` (the *Mark as inactive* section, end of the left
    column)
  - `GuestGroupDetail-Reactivate` (search with an inactive guest picked). The report form's
    *Someone new came* isn't drawn; it follows the same board.
  - `PersonTimeline-Status` (member, elder, *This year*), `PersonTimeline-Status-Dark-ES` (guest),
    `GuestDetail-Timeline-Status-Leader`, `GuestDetail-Activity-Status-Leader`
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9).
  No new tokens.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Permissions, API client, types, actions | ⬜ | |
| 2. Guests list | ⬜ | |
| 3. Guest detail: inactive state and dialogs | ⬜ | |
| 4. Reactivate and add (Group detail, report form) | ⬜ | |
| 5. Timeline entries | ⬜ | |
| 6. Design review fixes | ⬜ | |

### Decisions and deviations

- (none yet)

## Token changes

None. Inactive surfaces reuse what inactive members use: the neutral badge with a hollow dot, the
muted avatar, the banner surface and the danger outline. The timeline's status row uses the month
heading's surface (`thead`) as its background.

## The API

From the cross-repo spec's *Contracts*:

- `POST /guests/{id}/deactivate`
  - Body `{ reason, effectiveDate, note? }` → guest detail.
  - 409 `code`: `already_inactive`. 422 for a future date.
- `POST /guests/{id}/reactivate`
  - Body `{ note? }` → guest detail. 409 `already_active`.
- `GET /guests/{id}` gains `status`, `inactiveSince`, and (with `guests: deactivate`, else null)
  `inactiveReason`, `inactiveNote`, `statusHistory`.
- `GET /guests?status=active|inactive|all` now filters on status; rows gain `status`,
  `inactiveSince`, `inactiveReason`.
- `GET /guests/search` rows gain `status`, `inactiveSince`.
- `POST /small-groups/{id}/guests` gains `reactivate: bool`, `reactivateNote?`. An inactive guest
  without `reactivate` is 409 `guest_inactive`.
- `GET /members/{id}/timeline`, `GET /guests/{id}/timeline` gain `entries`:
  `{ kind: "report", date, report }` (today's row) or
  `{ kind: "status", date, status, reason, note, changedBy: { memberId, name } | null }`. `rows`
  goes away later (API stage 5).
- Guest reasons: `moved_away`, `stopped_attending`, `joined_another_church`, `deceased`, `other`.

## Stage 1: permissions, API client, types, actions

- `lib/auth/permissions.ts`: add `"deactivate" | "reactivate"` to the `guests` union.
- `api/guests-api/`:
  - types: `GuestStatus`, `GuestInactiveReason` (the five values), the new fields,
    `GuestStatusChange`;
  - client: `deactivateGuest`, `reactivateGuest`, the `status` param on the list, `reactivate` /
    `reactivateNote` on the add-guest call (it may live in `api/small-groups-api/`; keep it beside
    the existing add).
- `app/(app)/guests/_actions/guest-actions.ts`: `deactivateGuestAction` (`guests: deactivate`) and
  `reactivateGuestAction` (`guests: reactivate`), each checking the permission before calling the API
  (*permissions rule 7*) and returning `{ ok: true, guest }` or `{ ok: false, code?, error }` like the
  member status actions. Revalidate `/guests` and the guest.
- `getApiErrorMessage`: map 409 `guest_inactive`, `already_inactive`, `already_active` for guests by
  `code`, as the member ones are.
- Reuse the reason chip and label helpers from members (`inactive-reason-chip.tsx`): give them a
  guest reason set rather than copying the component. Move them to `components/` if that reads
  better; note it in the log.

## Stage 2: Guests list (`/guests`)

**Files:** `_components/guests-list.tsx`, `guests-browser.tsx`, `guests-summary-table.tsx`,
`guest-card-summary.tsx`, `guest-group-cell.tsx`.

- Tabs: *Active* (default), *Inactive*, *All* with counts, `?status=` in the URL as the members list
  does. The old `inactive` tab key meant "not in a group"; it now means status. Fix every reader of
  the old meaning (grep `tabInactive`, `status=inactive` in `app/(app)/guests`).
- Active tab: the columns stay; a guest with no group shows *Not in a group* with when and why they
  left, as today.
- Inactive tab: *Guest group* becomes **Left** (date over the reason, reason empty without
  `guests: deactivate`), *Last at a meeting* becomes **Last group** (neutral pill). Rows link to the
  guest.
- All tab: inactive rows get the *Inactive* badge after the name, and the *Left* cell.
- Below `md`, the cards show the same badge and the Left line.
- Rename copy keys whose text changes (see *Copy*), so a stale Spanish string can't survive.

## Stage 3: Guest detail, inactive state and dialogs (`/guests/[id]`)

**Files:** `[id]/_components/guest-detail-header.tsx`, `guest-groups-card.tsx`, new
`mark-guest-inactive-section.tsx`, `guest-status-card.tsx`, the two dialogs.

- Header: the *Inactive* pill after the *Guest* pill; *Inactive since {date}* replaces *In {group}*;
  muted avatar.
- Banner (inactive, Profile tab only): title, *Left {date} · {reason}*, the body copy, and
  *Reactivate…* when the caller has `guests: reactivate`. Without `guests: deactivate` the reason is
  left out of the line.
- Group history: the period ended by deactivation reads *Ended when marked inactive* (from
  `left_reason = guest_inactive`).
- Left column, after *How she came*:
  - active, with `guests: deactivate`: the *Mark as inactive* danger section;
  - inactive, with `guests: deactivate`: *Status history* (newest first, reason chip, *{date} · by
    {name}*, note), and its private footer.
- Deactivate dialog: reason select (five reasons), *Date she left* (today or earlier), note, *What
  happens* (leaves the group today; moves to Inactive). Submit is danger.
- Reactivate dialog: note, the info line that the old group isn't restored.
- Both finish like the member dialogs: `router.replace("/guests/{id}?saved=inactive|reactivated")`
  and the page shows the toast.

## Stage 4: reactivate and add

**Files:** `app/(app)/groups/[id]/_components/add-guest-dialog.tsx`,
`app/(app)/groups/reports/_components/report-guests.tsx` and `person-step.tsx` (*Someone new came*),
`app/(app)/guests/_components/similar-guests.tsx`, `app/(app)/groups/_actions/guest-actions.ts`.

- Search results show the *Inactive* pill and *Left {date} · last in {group}* as the sub-line.
- Picking an inactive guest shows the note block (title, body, optional note, who sees it); the
  primary button becomes *Reactivate and add*. The call sends `reactivate: true` and the note.
- A caller without `guests: reactivate` sees the result but can't pick it, with the reason in the
  sub-line. (Today every guest-group leader has it, so this is a guard, not a state to design.)
- A 409 `guest_inactive` (stale page) shows its message and switches the row to the inactive state.
- In the report form the guest joins from the meeting date as today; only the status change is today.
- *Add a new guest*'s possible matches show the *Inactive* pill too.
- Toast: *{name} reactivated and added to the group*.

## Stage 5: timeline entries

**Files:** `components/report-timeline/` (`report-timeline.tsx`, `timeline-board.tsx`,
`timeline-month.tsx`, `timeline-row.tsx`, `recent-activity-card.tsx`; not `components/person_timeline/`,
which is the application's baptism and class events), `api/small-groups-api/types.ts`
(`PersonTimeline`, `TimelineRow`).

- Read `entries`, not `rows`. Types: a `TimelineEntry` union on `kind`; unknown kinds are dropped
  when parsing, before anything renders, with a comment pointing to rule 15.
- Status row: date and *Status change* in the left column; on the right the archive (inactive) or
  undo (reactivated) tile, the title, the reason chip, *by {name}* (left out when `changedBy` is
  null), and the note. Shaded with the month heading's surface. No *View report* link, no group.
- Month headings count reports only; a month with only a status change says *Status change*.
- The summary line and *Show N reports* count reports only (rule 14).
- With a group picked, the API sends no status entries: nothing to do here beyond not assuming them.
- The end line becomes *That's everything since her first activity* for members (guests keep *since
  her first visit*).
- Recent activity shows the 3 entries the API returns with `latest=3`, of any kind; the status row
  renders the same, compact.
- Copy for the card's eyebrow can stay *From small group reports* until a third kind exists; the
  board uses *Reports and status changes*. Pick one and note it.

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `GuestsBrowser.tabActive` | Active | Activos |
| `GuestsBrowser.tabInactive` | Inactive | Inactivos |
| `GuestsBrowser.colLeft` | Left | Salió |
| `GuestsBrowser.colLastGroup` | Last group | Último grupo |
| `GuestsBrowser.noInactive` | No inactive guests. | No hay invitados inactivos. |
| `GuestStatus.inactive` | Inactive | Inactivo |
| `GuestStatus.inactiveSince` | Inactive since {date} | Inactivo desde el {date} |
| `GuestInactiveReason.moved_away` | Moved away | Se mudó |
| `GuestInactiveReason.stopped_attending` | Stopped attending | Dejó de asistir |
| `GuestInactiveReason.joined_another_church` | Joined another church | Se unió a otra iglesia |
| `GuestInactiveReason.deceased` | Deceased | Falleció |
| `GuestInactiveReason.other` | Other | Otro |
| `GuestInactiveBanner.title` | {name} is an inactive guest | {name} es un invitado inactivo |
| `GuestStatusCard.dangerTitle` | Mark as inactive | Marcar como inactivo |
| `GuestStatusCard.history` | Status history | Historial de estado |
| `DeactivateGuestDialog.title` | Mark {name} as inactive | Marcar a {name} como inactivo |
| `ReactivateGuestDialog.title` | Reactivate {name} | Reactivar a {name} |
| `AddGuestDialog.reactivateAdd` | Reactivate and add | Reactivar y agregar |
| `AddGuestDialog.inactiveTitle` | {name} is inactive. | {name} está inactivo. |
| `PersonTimeline.statusChange` | Status change | Cambio de estado |
| `PersonTimeline.markedInactive` | Marked inactive | Marcado como inactivo |
| `PersonTimeline.reactivated` | Reactivated | Reactivado |
| `GuestStatusToast.reactivatedAdded` | {name} reactivated and added to the group | {name} se reactivó y se agregó al grupo |

The rest (banner body, danger body, dialog help text, *What happens* lines, the note block, the
timeline footer) is on the boards in both languages; copy it from there. The boards write Spanish
in the feminine because Karla is the example. The app uses the generic masculine, as `MemberStatus`
and `MemberInactiveBanner` do (*Inactivo*, *un miembro inactivo*), so use that. Put the timeline keys
in whichever namespace `components/report-timeline/` already uses instead of a new `PersonTimeline`.

## Not in this spec

- Group joins, leaves and moves on the timeline (rule 17). The entry union makes them a new `kind`.
- Bulk deactivate, reports by reason, promoting a guest to member.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; list pages switch table → cards
      below `md`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] Focus ring visible on every control; keyboard order and focus after dialogs make sense.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] As a leader: no *Mark as inactive*, no reason or note on Guest detail, *Reactivate and add*
      works, and the timeline of a reactivated guest shows reason and note.
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
