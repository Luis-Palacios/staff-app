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
| 1. Permissions, types, API client, the setting | ✅ | `9014126` |
| 2. Menu, Groups badge, New group audience | ✅ | `316cc84` |
| 3. Group detail for guest groups | ✅ | `89bf3fa`, `64f30f6` |
| 4. Report form and report detail with guests | ✅ | `c98b0c8`, `2a73445` |
| 5. Guests list, detail and form | ✅ | `eaeb7f0` |
| 6. Badges elsewhere and `person` everywhere | ✅ | `fd937c1` |
| 7. Design review fixes | ✅ | this commit |

### Where to pick up

All seven stages are done on branch `guest-small-groups` (review log under *Stage 7* below). What is
left is the items under *Not checked*. membership-management's stage 7 (`c1a1d80`) is in and read here.

Dev data (reseeded 2026-10-23 with `--reset`, so it is the seed's): guest groups *Primeros Pasos*
(id 6) and *Nuevos Comienzos* (id 7), 12 guests (Walter streak 4, Mayra streak 6, Tatiana moved
groups, near-duplicate Carolinas). Added by hand: guest *Prueba Nueva* in Primeros Pasos (joined
2026-10-23, shows *New*). Links the reseed wiped and I re-made so the report form and leader view
work: the admin user (lrpalaciosdev@gmail.com) to member #1 Lesbia Cruz, and *Luis Leader*
(lrpalaciosdev+1) to member #32 Manuel Silva Vargas, leader of Nuevos Comienzos.

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
- **Stage 3:** `/groups/[id]` branches on `audience`. Guest groups get `GroupGuestsCard` above
  `GroupMembersCard`, which now filters to `person.type === "member"` and reads *Leaders and
  members* with the help line. Server actions are in `_actions/guest-actions.ts`
  (`searchGuestsAction`, `addGuestAction`, `removeGuestAction`); `lib/guest-errors.ts` maps the
  409/422 phrases and reads `otherGroup`; `lib/guests.ts` holds
  `GUEST_STOPPED_COMING_SUGGEST_AFTER` and the 14-day *New* window.
- `AddGuestDialog` takes `variant: "group" | "report"` and `joinedAt`, so stage 4 reuses it as
  *Someone new came*. It is a HeroUI `Modal` with `placement="auto"`: a bottom sheet **below `sm`
  (640px)**, not `md`, because that is HeroUI's breakpoint. Results are a `ListBox` (listbox role)
  with *Add “{q}” as a new guest* as the last option. Close matches (name and phone searches,
  merged) show on the new-guest step with *Use this guest*, which returns to the search with them
  picked. The invited-by picker reuses `listMembersForPickerAction`.
- *Remove from group…* opens the reason dialog with nothing picked (the button stays off until one
  is chosen); *Mark as stopped coming* opens it with *Stopped coming* picked. A new guest's id isn't
  in the add response (it returns the group), so `onAdded` gets `id: null` for new guests; stage 4
  must find the new row by name/diff or the API should return the id.
- Add a guest also needs `guests: search`; *View guest* / *Edit details* follow `guests: view` /
  `update`. With the setting off the add button is hidden but the card and *Remove* still work.
- Close group's confirmation now counts `memberCount` (members only), so a guest group's dialog
  doesn't call guests "members"; its text still doesn't mention guests.
- **Browser pass (stages 2–3), admin, setting on:** checked at 1440 in dark + Spanish and light:
  the Invitados menu item, New group audience cards and lock note, the Groups detail of a new guest
  group (badge, counts, both cards), Add a guest (search, existing result, already-in-group
  disabled, new-guest step), Remove with the reason dialog (button off until a reason is picked),
  and the toasts. Found and fixed: re-adding a guest the same day they left is a 409 `overlaps an
  earlier period`, which showed the generic error; it now has its own message.
  **Not checked:** 390 and 1024 (the browser window wouldn't go narrower than its minimum), English,
  the *Move to this group* note, close matches on the new-guest step, the stopped-coming panel and
  the *New* → *Participant* switch (no guest group with reports/older guests in dev data), and the
  leader view. Left in the dev data: a guest group *Test guests* (id 7) and two test guests (Ana
  Prueba, Beto Prueba).
- **Stage 4:** the form keys answers by `personKey` (`"member:12"` / `"guest:4"`, `_lib/person.ts`);
  drafts saved with plain member ids are migrated on load. The attendance input sends `memberId` or
  `guestId`. A guest group's roster is shown guests first (`guestsFirst`), in the quick list, review,
  edit and one person at a time; the API also sends `audience` on the roster and detail `smallGroup`
  (typed now). `_components/report-guests.tsx` holds `useReportGuests` (add/remove dialogs, toast,
  roster reload, marks), `SomeoneNewButton` and `StoppedComingPanel`; `ReportListStep` and
  `PersonStep` get `guests` (null for member groups) and `audience`.
- *Someone new came* adds immediately, reloads the roster, and marks the new row *came* only (the church
  question stays theirs to answer); one person at a time jumps to the new guest. The add response now
  carries `guestId` (membership-management `0e270fd`), so `onAdded` always gets the id.
- *Remove after this report* is on the stopped-coming panel (streak 3+), opens the stage 3 dialog with
  *Stopped coming* picked and the report note, calls `removeGuestAction` with `leftAt` = meeting date,
  and turns the panel into *Leaves the group after this report.* (kept only until the page reloads; the
  suggestion shows again after a reload while the roster of that date still lists them). A guest at 3+
  shows the panel instead of the "Missed the last N meetings" hint; at 2 the hint stays.
- A guest group's *Leaders and members* block is hidden when it has no rows.
- Report detail: rows read `person`; a guest's role reads *Participant*; the name links to `/guests/{id}`
  when the caller has `guests: view` (404 until stage 5). **Conversations on a guest's row are not shown
  yet:** the conversations client has no guest anchor, that is stage 6.
- **Browser pass (stage 4), admin, dark + Spanish, 1152px window:** quick list of *Test guests* (two
  blocks, counts, *Someone new came*), adding a new guest from it (dialog, toast, gold edge, *Agregado
  ahora…*, *came* pressed, count 3), one person at a time (*Participante* badge, *Vino alguien nuevo*
  under the card), submitting a report with three guests (200, redirect), report detail and the edit
  form. No console errors. **Not checked:** light mode, English, 390 / 1024 (window minimum), the
  stopped-coming panel and *Remove after this report* (no guest with a streak of 3+ in dev data), the
  move note in the report dialog, the leader view, a member group report after the change (only by
  code: `audience` is `members` so no block or controls render).
- Checked with `pnpm lint` (one existing warning in `member-form.tsx`, not touched) and
  `pnpm exec tsc --noEmit`. Nothing visible changes, so no browser pass.

- **Stage 5:** `/guests` is server-driven: `?status=active|inactive|all&q=&page=` goes to
  `GET /guests` (25 per page), so tabs, search (300 ms debounce, `router.replace` in a transition that dims
  the list) and the footer's Previous/Next are navigations; counts come from the API. Every guest page
  calls `requireGuests()` (`_lib/require-guests.ts`): `notFound()` when `features.guestGroups` is off or
  the permission is missing; scope (leaders) is the API's 404. Detail: a viewer without the list gets
  Groups › group › guest and a *Back to {group}* button (only if they can open the group); group history
  links and report links follow access. Observations show only when the API sends them. Form
  (`GuestForm`): similar guests (name, and phone once a number is typed) via `searchGuestsAction` and
  the dialog's exported `useGuestSearch`/`GuestMeta`, with *Open* only for `guests: all`; the group select
  (new only) lists open guest groups and needs `smallGroups: manageMembers`; edit sends only changed
  fields, never invents a first visit that was empty, and sends `invitedByMemberId` only if changed (if the
  member picker is refused for the caller, the field is disabled and not sent). `GuestsBadge` takes a
  `label` ("Guest" on detail). New guest/edit toasts use `GuestSavedToast`.
- **Browser pass (stage 5), admin:** list in dark + Spanish and light + English (tabs, counts, search,
  group cell, *Not in a group* with when and why), detail (all cards), `/guests/new` with the similar-guest
  panel for "Ana", creating *Elena Prueba* into *Test guests* (redirect to detail), editing her phone
  (saved, shown). **Not checked:** 390 and 1024 (window minimum is 1152, so the card list, the sheet
  layout and the table's horizontal scroll below `md` are unverified), the leader view and its
  breadcrumb/back button, the warning pill (no guest with a missed streak of 2+), pagination (4 guests),
  invited by, the form's validation errors, a 404 with the setting off, light mode on detail/form.

- **Stage 6:** `memberId`/`memberName` are gone from `SmallGroupMember`, `ReportRosterPerson`,
  `ReportAttendance` and the conversation types; every reader uses `person` (`member` stays where it is
  the member: submitter, leaders, comment authors). `audience` is typed on the report list items, summary,
  week and shared shapes, and `GuestsBadge` sits beside the group name on Report status (table, cards and
  *Needs follow-up*), Prayer & follow-up entries, Reports (table and cards), My groups and Conversations
  rows (inbox and the dashboard block). Not on the report detail header.
- Conversations: `ConversationAnchor` is a union (`memberId` or `guestId`); `getConversation` and
  `addComment` take a person (`/{id}` or `/guests/{id}`); helpers in `lib/conversation-format.ts`
  (`personAnchor`, `anchorTarget`, `personQuery`). The panel opens by `?person=<memberId>` (unchanged) or
  `?guest=<guestId>`, and the row control carries `data-conversation-person="member:12"`. The panel's
  person is `person: Person`; summaries are matched to rows by `personKey(summary.person)`, so a guest's
  row now has its conversation control in report detail.
- **Resolved:** the inbox row's `group` now carries `audience` (membership-management `c1a1d80`), so
  Conversations rows and the dashboard block read `item.group.audience`; `lib/guest-groups.ts` is deleted.
- **Browser pass (stage 6), admin, 400px viewport (the window wouldn't widen), light and dark:** on *Test guests*
  (given a Friday meeting day and a leader, a quick-list report on it with a prayer text, one conversation on
  Beto) the badge shows on Report status (table row and *Needs follow-up*), Reports (card), Prayer & follow-up,
  and the Conversations inbox (the dashboard block uses the same row). A guest's conversation: the row control
  links to `?guest=2`, the panel opens with the name from `person`, starting a thread works, the row then shows
  the thread (1 comment, Open) and focus returns to it; a member's panel (`?person=`) works as before. Dark
  checked on the inbox and the guest panel. No console errors. Test data is gone: report deleted (took the
  thread), meeting day back to not set, leader removed (their closed period stays in the group's history).
  **Not checked:** Spanish on the badge rows (the cookie I set didn't take), English/Spanish on the panel,
  My groups (needs a leader of a guest group), the report table at 1024+, 1024 and a real 390 layout of
  the inbox.
- The report roster of 23 Oct listed Ana Prueba, who left *Test guests* that same day; that is the API's
  rule (a guest who leaves today is still in today's roster), not a staff-app change.

- **Stage 7 (design review), admin and leader, ES and EN, light and dark.** Widths: the window won't go
  below 1024, so 390 was checked in a same-origin 390px `<iframe>` (its media queries follow its own
  width), 1024 in the window, 1440 in a 1440px iframe (programmatic overflow check only, no screenshot).
  Audit of Guests (list, detail, new, edit), Groups, New group, Group detail, Reports, report form,
  report detail and Conversations at 390 / 1024 / 1440 in both themes: no page scrolls sideways.
  Found and fixed: **(1)** close matches on the new-guest step truncated the name at 390 (the button took
  the room): the row stacks below `sm` and the name wraps; **(2)** the search results truncated names and the
  Spanish *Add “{q}” as a new guest* label at 390: they wrap; **(3)** the picked guest in the Add a guest
  list had no visible selection (only `aria-selected`): the list shows the check indicator like the other
  pickers; **(4)** `/guests?page=N` past the last page showed *No guests match your search* with no way back:
  it redirects to the last page.
- **Review results.** Move note (group dialog and report dialog), close matches, *Remove after this report*
  dialog (opens with *Stopped coming* picked, Cancel returns focus), stopped-coming panel on Group detail
  and in the report form (Mayra 6, Walter 4), *New* pill (Prueba Nueva) and Participant on older guests,
  form validation on `/guests/new` (ES), My groups and the leader's dashboard block with the badge, the
  Guests badge on every row in Spanish (Groups, Reports, Prayer & follow-up, dashboard). Leader view
  (Luis Leader): no Guests menu, only their group in the list (others 404), Group detail with *Add a guest*,
  report form with *Someone new came*, `/guests/{id}` of their guest shows Groups › group › guest and
  *Back to {group}*, a guest of another group 404s. **Setting off** (`GUEST_GROUPS_ENABLED=False` in
  membership-management's `.env`, API reloaded; turned back on): no Guests menu, `/guests`, `/guests/1` and
  `/guests/new` are 404, New group has no audience choice, member groups and member group reports have no
  guest text. Existing guest groups keep their badge and pages (spec rule 1: existing data is never
  touched). Grep: no color/font literals in the changed files, no new `dark:` overrides, no reads of
  `memberId`/`memberName` on attendance, roster or conversation rows (the two left are the conversation
  anchor union and a comment author, which are members).
- **Deviations accepted.** The Guests table keeps `min-w-[860px]` (the board has 820 and also scrolls inside
  its box); at 1024 with the sidebar it scrolls inside the card, as the Members table does (940). Dialogs
  become bottom sheets below `sm` (640px), HeroUI's breakpoint, not `md` (see stage 3).
- **Not checked.** The page-2 state of the Guests footer (25 per page, 12 guests in dev data; only the
  past-the-end redirect was); *Leaves the group after this report* after *Remove* (it removes a seeded
  guest, so only the dialog was opened); a Spanish Conversations row for a guest group (the seed has no
  guest-group conversation; English was checked in stage 6); the warning pill on `/guests` was seen only
  as *Missed the last 6 meetings* (list) not the 2-streak variant; a 1440 screenshot (stages 2–5 saw 1440).
- Seed oddity, not ours: *Elmer Jarquín Báez* is marked Sexo *Mujer*/*Hombre* by the seed's random pick, and
  the report form asks *Church, Sun, Oct 18* for a guest who joined on 23 Oct (the API's roster rule).

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

- [ ] Every board matches in light and dark: layout, spacing, type, states. (Compared the Guests and
      Guest form board sources with the app and spot-checked the rest on screen; I did not diff every
      board, so this stays open for a visual pass against the canvas.)
- [x] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; the Guests table switches to
      cards below `md`; dialogs become bottom sheets below `md`.
- [x] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [x] Gold never carries text on a light ground; status shows a dot and a word; the Guests badge is
      an outline, never filled.
- [x] Focus ring visible on every control; focus after the add and remove dialogs returns to the
      button that opened them; the search result list is a proper listbox.
- [x] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [x] With the setting off: no Guests menu, no audience choice, no guest UI anywhere, and member
      groups look exactly as before.
- [x] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
