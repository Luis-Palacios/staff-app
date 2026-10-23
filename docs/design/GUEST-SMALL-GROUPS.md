# Guest small groups: guest groups, guests in reports, the Guests pages

Implementation spec for **guest small groups** (Groups, Group detail, the report form, and a new
**Guests** item after Members, `/guests`). Read the cross-repo spec first:
`../docs/specs/guest-small-groups.md` (workspace folder `members-management/docs/specs/`); its rules
are referred to as *rule N*. After this work, in a church with guest groups turned on:

- **Groups:** guest groups are listed with member groups, with a **Guests** badge; *New group* asks
  who the group is for (create only).
- **Group detail (guest group):** guests listed apart from the leaders and members, *Add a guest*
  (search, move from another group, new guest with a possible match), *Remove* with a reason, and the
  *stopped coming* suggestion.
- **Report form (guest group):** attendance in two blocks, *Someone new came*, and *Remove after this
  report* on guests who stopped coming.
- **Guests** (admins and elders): list, detail and the add/edit form. Leaders open a guest from their
  group or the report.
- The badge on every row that names a guest group; conversation rows read `person`.

**Decided:** everything in the cross-repo spec's *Rules*, plus these UI decisions (don't reopen):

- UI words: **Guests / Invitados**; a guest's role shows as **Participant / Participante**; a
  just-added guest shows **New / Nuevo** (green) on Group detail for their first two weeks.
- The badge is an **outline pill** with the waving-hand icon (heroicons `hand-raised`): border
  `border-strong`-like (`line-strong` light / `field-line-on-dark` dark), text `heading`, icon
  `eyebrow` color. It is a kind, not a status, so it's never filled.
- The stopped-coming suggestion is the warning-soft panel under the row (clock icon, bold first
  sentence, outline button on the surface color). No dismiss, no counter: it shows while the streak
  is 3+ (`GUEST_STOPPED_COMING_SUGGEST_AFTER = 3`, one constant).
- *Add a guest* and *Someone new came* are the same component: a dialog on `md`+, a bottom sheet
  below. Search first; *Add “{q}” as a new guest* is always the last option; a guest already in this
  group is listed disabled; picking one active in another group shows the move note and the primary
  button changes to *Move to this group* (report form: *Move here and mark as came*).
- A guest added from the report form is added **immediately** (server action), its row appears with
  the gold edge (`focus-row` + 3px gold inset, as the conversation panel's open row), sub-line *Added
  just now*, *came* already pressed, and a toast.
- *Remove* always asks why (radio: *Stopped coming* / *Other reason*); *Mark as stopped coming* opens
  it with *Stopped coming* picked.

**Depends on:** `auth-server/docs/GUEST-SMALL-GROUPS-HANDOFF.md` (the `guests` permissions) and
`membership-management/docs/GUEST-SMALL-GROUPS-API-HANDOFF.md`: its stages 1–2 for stages 1–3 here,
stage 3 for stage 5, stage 4 for stage 4, stage 5 for stage 6. If a stage starts before the API is
ready, note it and stub nothing in committed code.

**Deploy order:** stage 6 here (every reader of a participant, attendance row or conversation uses
`person`) must be deployed before `GUEST_GROUPS_ENABLED` is turned on anywhere. Until then guest rows
can't exist, so earlier stages are safe to deploy.

Work through it **stage by stage**, one reviewable commit per stage, on the **`guest-small-groups`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light
and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each stage,
write a short summary of what changed and anything that differs from the canvas in the progress log
below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Guests"**, its four rows and the blue rules notes (and the orange note on badges).
- **Boards:**
  - `GuestGroupDetail` (tweaks `overlay`: `none`/`menu`/`add`/`move`/`new`/`remove`, `toast`,
    `viewer`, `lang`, `mode`), with `GuestGroupDetail-Add`, `-Move`, `-New`, `-Remove`, `-Dark-ES`.
  - `ReportFormGuests` (tweaks `size`: `desktop`/`phone`, `overlay`: `none`/`add`/`move`/`new`), with
    `ReportFormGuests-Add`, `-Move`, `-Phone-Person`, `-Phone-Add`, `-Phone-New`,
    `-Phone-Move-Dark-ES`.
  - `Guests` (tweaks `filter`, `state`), `Guests-Inactive-Dark-ES`; `GuestDetail` (`viewer`:
    `elder`/`leader`), `GuestDetail-Leader`; `GuestForm` (`variant`, `matches`), `GuestForm-Edit`.
  - `Groups-Guests` and `GroupForm-Guests` (the shared `Groups` / `GroupForm` boards with
    `guests = on`); `Sidebar` with `guests = on` shows the menu item.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced 2026-10-22.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Permissions, types, API client, the setting | ✅ | this commit |
| 2. Menu, Groups badge, New group audience | ✅ | this commit |
| 3. Group detail for guest groups | ⬜ | |
| 4. Report form and report detail with guests | ⬜ | |
| 5. Guests list, detail and form | ⬜ | |
| 6. Badges elsewhere and `person` everywhere | ⬜ | |
| 7. Design review fixes | ⬜ | |

### Decisions and deviations

- **Stage 1:** the setting is `Me.features.guestGroups`, read through `getFeatures()`
  (`api/members-api/client.ts`), which reuses the `cache()`d `getMe()`: one `/me` call per request.
  Guest routes live in a new `api/guests-api/` (client + types); add/remove guest are in
  `small-groups-api` beside the member ones. `Person` is a discriminated union; `audience` is on
  group summary, detail and the create input (not on `updateSmallGroup`, which omits it).
- `memberId`/`memberName` stay typed as non-null on `SmallGroupMember`, `ReportRosterPerson` and
  `ReportAttendance` so nothing else changes in this stage, though the API sends null on guest rows.
  Guest rows can't exist until the setting is on, and stage 6 moves every reader to `person` and
  drops those keys from the types.
- **Stage 2:** `features` travels in `UserProvider` (read once in the `(app)` layout; a failed read
  means "off"), with `useFeatures()`. `NavItem.feature` hides an item when its setting is off;
  `getVisibleNavItems(permissions, features)`. The Guests nav item links to `/guests`, which stage 5
  builds: until then it 404s, but only with the setting on. `GuestsBadge` borders with
  `border-field-border` (already `field-line-on-dark` in dark), so no token change. The New group
  page reads `getFeatures()` on the server and passes `askAudience` to `GroupForm`.
- Stage 2 was checked with lint and `tsc` only. Not yet looked at in a browser: it needs the API
  running with `GUEST_GROUPS_ENABLED` on, so do the light/dark, 390 and Spanish pass for stages 2–3
  together once Group detail exists.
- Checked with `pnpm lint` (one existing warning in `member-form.tsx`, not touched) and
  `pnpm exec tsc --noEmit`. Nothing visible changes, so no browser pass.

## Token changes

None. Everything uses existing tokens (`line-strong` for the badge border, `warning-soft` for the
suggestion, `success-soft` for *New*, `focus-row` for the just-added row).

## The API

Shapes in the cross-repo spec's *Contracts* and the membership-management handoff. In short:

- `GET /me` → `features.guestGroups`. Read it once per request with the session (`cache()`d like
  `getMe()`), never from an env var of this app.
- Groups carry `audience`; guest group detail has `guestCount`, `memberCount`, and per guest row
  `missedStreak`, `lastAttendedDate`.
- `person: { type: "member" | "guest", id, name }` on group detail rows, roster rows, report detail
  attendance rows, conversation summaries and inbox rows.
- `POST /small-groups/{id}/guests` (`guestId` | `newGuest`, `joinedAt`, `moveFromOtherGroup`),
  `DELETE /small-groups/{id}/guests/{guestId}` (`leftReason`, `leftAt`).
- `GET /guests`, `GET /guests/search?q=`, `GET /guests/{id}`, `POST /guests`, `PATCH /guests/{id}`.

Errors the UI tells apart (status + a phrase from `detail`, never shown raw):

| Status | `detail` contains | UI |
| --- | --- | --- |
| 409 | `guest groups are off` | toast *Guest groups are turned off for this church.* and refresh |
| 409 | `in another group` | show the move note (body has `otherGroup`), don't toast |
| 409 | `already` (guest in this group) | toast *{name} is already in this group.* |
| 422 | `guest group` | shouldn't happen from the UI; generic error |
| 422 | `attendance` | existing stale-roster handling (reload the form) |
| 422 | `before` (leftAt before a filed report) | toast *They're in a later report; remove them from there first.* |

## Stage 1: Permissions, types, API client, the setting

- `lib/auth/permissions.ts`: `guests: "all" | "view" | "search" | "create" | "update"`.
- A `getFeatures()` (or a field on `getMe()`) returning `{ guestGroups }`.
- Types and client functions for every route above, next to the existing small group and member
  ones; `person` as a discriminated union; `audience` as `"members" | "guests"`.
- Nothing visible changes in this stage.

## Stage 2: Menu, Groups badge, New group audience

- `config/site.ts`: **Guests** after Members, `requires: { guests: ["view", "all"] }` and only when
  `features.guestGroups` (nav and page make the same check; the page is `notFound()` otherwise). Icon
  `hand-raised`. Leaders never see it.
- A `GuestsBadge` component (outline pill, rule above), used here and in stage 6.
- Groups list: the badge under a guest group's name; the count line reads *{n} guests · {m} members*;
  the card links to the same `/groups/[id]` route (Group detail branches on `audience`).
- New group: *Who is this group for?* (two radio cards, *Members* / *Guests*, with the lock note
  *This can't be changed after the group is created.*), only when the setting is on and only on
  create. Edit group never shows it.

## Stage 3: Group detail for guest groups (`/groups/[id]`)

**Files:** `app/(app)/groups/[id]/…` (branch on `audience`; keep the member group page as is),
`_components/` for the roster blocks, the add dialog and the remove dialog, `_actions/` for add,
move and remove.

- Header: name + badge; meta *Meets {day}* · *{n} guests · {m} members*.
- Left column, two cards: **Guests** (*Add a guest*, primary) and **Leaders and members** (*Add
  member*, as today, with the help line). Guest rows: initials, name (→ Guest detail), *Joined {date}
  · {last seen}*, *Participant* or *New* pill, row menu (*View guest*, *Edit details*, *Remove from
  group…*).
- The suggestion panel under a guest row when `missedStreak >= 3`; its button opens Remove.
- **Add a guest** dialog / sheet: search (`/guests/search`, debounced, 2+ characters), results with
  name, ···· last 4, current or last group and last seen; disabled *Already in this group*; the move
  note when the picked guest has another current group; *Add “{q}” as a new guest* → the new guest
  step (name prefilled from the query, phone, first visit default today, invited by: member picker
  from `/members/options`), which searches again by name and phone and lists close matches with
  *Use this guest* before *Add new guest*. Focus returns to *Add a guest*; toast on success.
- **Remove** alert dialog with the reason radio; toast.
- States: closed guest group as the closed member group page (read-only, no add/remove, no
  suggestion).

## Stage 4: Report form and report detail with guests

- The roster comes back with `person`; the form keys answers by `person.type + id`.
- Quick list / review / edit: two blocks, **Guests** (hand icon, count) then **Leaders and members**
  (people icon, count), each with its rows; *Someone new came* (dashed full-width button) closes the
  Guests block.
- One person at a time: guests first, then leaders and members (same order as the list). *Someone new
  came* below the person card. The card shows the suggestion inside the hint area for a guest with
  streak 3+.
- *Someone new came* reuses stage 3's component with `joinedAt` = the meeting date and the copy from
  the boards; on success the person is added to the form state (marked *came*), with the gold edge and
  toast. If the API returns `in another group`, show the move note in place.
- *Remove after this report*: calls the remove action with `leftReason: stopped_coming` and `leftAt`
  = the meeting date **after confirming** (same dialog as stage 3, with the copy *They stay in this
  report and leave the group from this meeting on.*); the row stays in this report.
- Member groups are unchanged (no blocks, no suggestion, no *Someone new came*).
- Report detail: attendance rows read `person`; a guest's name links to Guest detail; observations
  and conversations as today.

## Stage 5: Guests list, detail and form (`/guests`, `/guests/[id]`, `/guests/new`, `/guests/[id]/edit`)

- **List** (`guests: view` + `all`): tabs *In a group* / *Not in a group* / *All* with counts,
  search, table (cards below `md`) with guest (first visit), phone, guest group (or *Not in a group*
  with when and why they left), last time at a meeting (success pill, warning pill when missed 2+),
  *Open*. Empty state as `Guests` with `state = empty`.
- **Detail** (`guests: view` + scope): header (initials, name, *Guest* badge, first visit, current
  group), *Contact & personal* and *How they came* cards, *Guest groups* history with reasons,
  *Recent meetings* with notes when allowed. A leader's breadcrumb is Groups › {group} › {guest} and
  the back button returns to the group.
- **Form** (`guests: create` + `all` for new; `guests: update` + scope for edit): fields as the board;
  similar guests (search by name and by phone) shown at the top while typing, each with *Open*; the
  group select lists open guest groups only and is optional; edit never shows the group (note about
  the group page instead).

## Stage 6: Badges elsewhere and `person` everywhere

- `GuestsBadge` next to a guest group's name on Report status, Prayer & follow-up, Reports, My groups
  and Conversations rows (rule 19). No counts are added together (rule 20).
- Every reader of a participant, attendance row or conversation summary/inbox row uses `person`
  (conversation rows: the guest's name; links open the panel by guest). After this ships, tell
  membership-management its stage 7 can drop `memberId`/`memberName`.

## Copy

New keys go in `messages/en.json` and `messages/es.json` (see "Adding UI text" in `CLAUDE.md`). The
boards hold the full strings; the main ones:

| Meaning | English | Español |
| --- | --- | --- |
| Menu, page title, badge | Guests | Invitados |
| Guest role | Participant | Participante |
| Just added | New | Nuevo |
| Counts | {n} guests · {m} members | {n} invitados · {m} miembros |
| Second card | Leaders and members | Líderes y miembros |
| Second card help | Church members who lead or help in this group. Guests can't lead. | Miembros de la iglesia que dirigen o ayudan en este grupo. Los invitados no pueden dirigir. |
| Add button / dialog | Add a guest | Agregar invitado |
| Dialog subtitle | To {group}. They join today. | A {group}. Entra hoy. |
| Search label / placeholder | Find a guest · Name or phone | Buscar invitado · Nombre o teléfono |
| New option | Add “{q}” as a new guest | Agregar “{q}” como invitado nuevo |
| New option hint | First time with us, or not found above | Primera vez, o no aparece arriba |
| Disabled result | Already in this group | Ya está en este grupo |
| Move note | {name} is in {group} since {date}. Adding them here moves them: their time in {group} ends today. A guest is in one group at a time. | {name} está en {group} desde el {date}. Si lo agregas aquí, se cambia de grupo: su tiempo en {group} termina hoy. Un invitado está en un solo grupo a la vez. |
| Move button | Move to this group | Cambiar a este grupo |
| New guest step | New guest · Joins {group} today. | Nuevo invitado · Entra hoy a {group}. |
| Matches | Is this the same person? · Use this guest | ¿Es la misma persona? · Usar este invitado |
| Suggestion | Hasn't come to the last {n} meetings. Still coming? | No ha venido a las últimas {n} reuniones. ¿Sigue viniendo? |
| Suggestion button | Mark as stopped coming | Marcar que dejó de venir |
| Remove reasons | Why are they leaving? · Stopped coming · Other reason | ¿Por qué sale? · Dejó de venir · Otro motivo |
| Report button | Someone new came | Vino alguien nuevo |
| Report button hint | Find them or add a new guest. They join the group from this meeting, marked as came. | Búscalo o agrega un invitado nuevo. Entra al grupo desde esta reunión, marcado como que vino. |
| Report add button | Add and mark as came · Move here and mark as came | Agregar y marcar que vino · Cambiar aquí y marcar que vino |
| Report remove | Remove after this report | Quitar después de este reporte |
| Report row | Added just now · joined from this meeting | Agregado ahora · entra desde esta reunión |
| Audience question | Who is this group for? | ¿Para quién es este grupo? |
| Audience options | Members: Church members. The usual small group. · Guests: People who aren't members yet: visitors and people going through the process. Led by members. | Miembros: Miembros de la iglesia. El grupo pequeño habitual. · Invitados: Personas que aún no son miembros: visitantes y personas en el proceso. Dirigido por miembros. |
| Audience lock | This can't be changed after the group is created. | Esto no se puede cambiar después de crear el grupo. |
| Guests intro | People who visit or are going through the process but aren't members yet. They're never mixed into Members. | Personas que visitan o están en el proceso, pero aún no son miembros. Nunca se mezclan con Miembros. |
| Tabs | In a group · Not in a group · All | En un grupo · Sin grupo · Todos |

Gendered Spanish (*Invitado/Invitada*, *Agregado/Agregada*) follows the guest's `sex` when known,
masculine otherwise, as the rest of the app does.

## Not in this spec

- Promoting a guest to member (later, from approving a membership application), merging duplicates,
  deleting guests, importing from the assimilation DB, welcome teams (rule 21).
- A per-church label for guests, and an audience filter on lists.
- A phone layout for Group detail beyond what the existing page already does at 390.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; the Guests table switches to
      cards below `md`; dialogs become bottom sheets below `md`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Gold never carries text on a light ground; status shows a dot and a word; the Guests badge is
      an outline, never filled.
- [ ] Focus ring visible on every control; focus after the add and remove dialogs returns to the
      button that opened them; the search result list is a proper listbox.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] With the setting off: no Guests menu, no audience choice, no guest UI anywhere, and member
      groups look exactly as before.
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
