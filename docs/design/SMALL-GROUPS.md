# Small groups: list, detail, form and member management

Implementation spec for the **Groups** section (sidebar Groups › List, `/groups`), which is a stub
today:

- a **groups list** at `/groups` (card grid, Active / Closed / All, search);
- a **group detail page** at `/groups/{id}` with its members, where members are added, their role
  changed (including swapping the leader) and removed, and where the group is closed;
- one **add/edit form** for the group's own details at `/groups/new` and `/groups/{id}/edit`.

**Decided:** members are managed on the detail page, not in the form. Each member action saves on
its own right away (the API has one endpoint per action), so it gets its own confirmation where
needed and a toast. The form covers only name, meeting day and meeting address. Closed groups are
read-only. Making someone leader while there's already one is a confirmed swap: the current leader
becomes co-leader.

**Depends on the API:** `membership-management/docs/SMALL-GROUPS-API-HANDOFF.md` must land first
(at least its Stages 1–3): it adds `leaderMemberId`/`leaderName` to `GET /small-groups`, the
single-transaction `PUT /small-groups/{id}/leader`, and 409 on `PATCH` of a closed group. If a
stage here starts before the API is ready, note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the **`small-groups`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in
light and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After
each stage, write a short summary of what changed and anything that differs from the canvas in
*Decisions and deviations* below, so it can be reviewed.

- **Approved design (source of truth for look):** Claude Design canvas "ekklesiaio Staff App"
  https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1, section "Small groups". Artboards:
  - `Groups` (props: `filter` = `active` | `closed` | `all`, `state` = `list` | `empty`),
    `Groups-Dark` (All tab).
  - `GroupDetail` (props: `status` = `active` | `closed`, `overlay` = `none` | `menu` | `add` |
    `swap` | `remove` | `close`, `toast` = `none` | `created` | `updated` | `added` | `role` |
    `leader` | `removed`). Wrappers: `GroupDetail-Dark` (row menu open), `GroupDetail-AddMember`,
    `GroupDetail-LeaderSwap`, `GroupDetail-Close`, `GroupDetail-Closed`. The `remove` confirm has no
    wrapper board: set `overlay = remove` on `GroupDetail`.
  - `GroupForm` (props: `variant` = `new` | `edit`, `state` = `default` | `errors`), wrappers
    `GroupForm-Edit`, `GroupForm-Dark` (new, errors).
  - `Sidebar`: Groups › List now points at `Groups`.
  - Read artboards with the Artifact tool's `read` and `path: "project/<Name>.dc.html"`. They hold
    exact px values and colors. Group names, people and addresses are illustration only.
- **Brand rules:** unchanged. Read `docs/design/BRAND-RESTYLE.md` → *Principles* before every
  stage. Error/danger red is the existing `--danger` token.
- **Patterns to reuse** (they exist since the Members work): `StaffAppPageHeader`, `card()` /
  `card({ interactive: true })`, `textLink()`, `StatusBadge` (tones), `InitialsAvatar`,
  `EmptyState`, the skeletons, `ConfirmDialog`, `SavedToast` (`app/(app)/members/[id]/_components/`
  — move it to `components/` now that two sections use it), `formatCalendarDate()` /
  `ageFromCalendarDate()` in `lib/format-date.ts`, `normalizeText()` in `lib/normalize-text.ts`,
  `getApiErrorMessage()`, the `load-member.ts` 404 pattern (positive-integer id check, 404/422 →
  `notFound()`), the members form's server-action + zod pattern (`_lib/member-schema.ts`,
  `_actions/member-actions.ts`), and the Applications status tabs.
- **UI text:** everything through next-intl, English + Spanish in the same change (`CLAUDE.md` →
  *Adding UI text*). Spanish uses *grupo pequeño* (never *célula*) and *tú*. Group names, member
  names and addresses are user data: never translated.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API client, types and server actions | [x] | (this commit) |
| 2. Groups list | [x] | (this commit) |
| 3. Group detail (read-only parts, closed state) | [x] | (this commit) |
| 4. Group form (new / edit) | [x] | (this commit) |
| 5. Member management (add, role, leader swap, remove) | [x] | (this commit) |
| 6. Close group | [x] | (this commit) |
| 7. Links from elsewhere + docs | [x] | (this commit) |

### Decisions and deviations

**Stage 1.** Types, client and actions as specified; `group-schema.ts` also lands here because the form
actions validate with it. `ApiError.method` isn't used to tell 409s apart; instead each action re-reads the
group on a 409 (closed -> `closed`; add and already a member -> `alreadyInGroup`; role asked for was leader ->
`hasLeader`). Form actions return `{ ok: false, fieldErrors?, formError? }` like the members form (success
redirects); member actions return `{ ok: true } | { ok: false, error?, message? }`. `closeGroupAction`
revalidates `/members` as a layout, since closing changes every member's group list. Checked with lint and
`tsc --noEmit` only: the actions need a signed-in session, so they haven't been run against the local API yet;
they get exercised for real in Stages 4-6.

**Stage 2.** The Applications status tabs became a shared `components/status-tabs.tsx` (generic, labels passed in);
`ApplicationsBrowser`'s `StatusFilter` now wraps it, same look and behavior. Weekday names live in a `Weekdays`
namespace (client-shipped) keyed through `lib/weekdays.ts`; Spanish values are capitalized ("Jueves") as on the
canvas, so Stage 3's "Se reúne los jueves" sentence needs its own lowercase handling. `GroupsPage` empty messages
were rewritten (new title/description, "Create a group..." body). Counts on the tabs follow the search, like
Applications; an active search shows "No groups match your search." on any tab. Not yet checked in a browser
(light/dark, 1440/1024/390, es): lint and `tsc --noEmit` only.

**Stage 3.** `SavedToast` moved to `components/saved-toast.tsx` (member detail now imports it from there);
group pages use a new `GroupSavedToast` message set ("Group created" / "Changes saved"). The members card has no
"Add member" button and no ⋯ menu yet: both arrive together in Stage 5 so nothing in the UI is a dead control.
"Meets {day}" uses `Weekdays.sentence.*` (es: "los jueves", lowercase, with the article), while cards and the
details card use the capitalized standalone names. The details card's leader and co-leaders come from the
members list (the detail has no separate leader field). `loading.tsx` is shared by detail and, later, edit.
Not yet checked in a browser (light/dark, widths, es, closed group, 404): lint and `tsc --noEmit` only.

**Stage 4.** The day chips are native radio inputs (arrow keys, one tab stop) restyled through `peer-*`
classes. Short day labels come from messages (`GroupForm.days.*`: Mon / Lun…), not `Intl`, so server and client
render the same text; each radio's accessible name is the full plural day ("Thursdays"). The edit page for a
closed group redirects to the detail page; if the group closes while the form is open, the update action's 409
also lands on the detail page. Not yet run end to end (create, edit, only-changed-fields, errors, dark, es):
lint and `tsc --noEmit` only; this is the first stage where the Stage 1 form actions can be exercised.

**Stage 5.** `GroupMembersCard` became a client component (namespaces `GroupMembers`, `GroupMembersCard`,
`SmallGroupRole` now ship to the browser) and owns the dialogs, the toast and the pending state. `ConfirmDialog`
gained `tone` (`danger` = red tile and `Button variant="danger"`; the tokens already give white text in light and
navy in dark) and `icon`; `SavedToast` gained `tone` (`danger` = red icon, `role="alert"`) and is re-keyed per
message to show from client state. The add-member dialog loads `GET /members` through a new
`listMembersForPickerAction` the first time it opens (once per page visit) and filters in the browser (max 6
results, members already in the group disabled with "Already in this group"); HeroUI `ComboBox` with controlled
`items`/`inputValue`. The role control and the dialog form remount on every open so they start empty. Errors: the
add dialog shows them inline; role, swap and remove errors show a danger toast; a `closed` error also refreshes
the page. Not yet run end to end: lint and `tsc --noEmit` only, so the "Done when" checklist (including focus
return and keyboard-only use) still needs a pass in the browser.

**Stage 6.** `CloseGroupCard` sits under When & where (the right column is now a wrapper with both cards, so
the details card lost its own flex basis). Deviation from the spec's "stay on the page, toast 'Group closed'": the
page does stay, but the toast comes from `router.replace("/groups/{id}?saved=closed")` and the existing
`SavedToast`/`?saved=` path, because the closed group no longer renders the card that would own a client toast.
Failures (including "already closed", which also refreshes the page) show a danger toast from the card. The
confirm text is an ICU plural on the member count (0 / 1 / many). Not yet run in a browser: lint and `tsc --noEmit`
only.

**Stage 7.** Member detail's group names link to `/groups/{id}`. Dashboard: the placeholder card became
`NoGroupsCard`, which shows only when the groups loaded and none is active (and then carries a "Create the first
group" action); with active groups, or if the fetch fails, it renders nothing. I chose to leave it out rather than
add an "{n} active groups" link, as the spec allowed. The Close wording was changed after Stage 6 review from "Ends
every membership today" to "Removes every member from the group today" (and the confirm text to match), since
"membership" read like church membership; the API only ends each person's time in that group. Verification: Luis tried every stage by hand against the local API, in light and dark, at 1440 / 1024 / 390
and in English and Spanish; nothing was scripted. The weekday short labels are messages, not `Intl`.

## The API (membership-management)

Router `membership-management/src/membership_management/api/routers/small_groups.py`, schemas in
`api/schemas/small_groups.py`. JWT-protected; call through `authenticatedFetch` with
`APPLICATIONS_MEMBERSHIP_API_URL` (same service as members). camelCase JSON. Dates are date-only
`"YYYY-MM-DD"`.

```ts
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO: 1 = Monday … 7 = Sunday
export type SmallGroupRole = "member" | "leader" | "co_leader"; // already in members-api types

export interface SmallGroupSummary {
  id: number;
  name: string;
  meetingAddress: string | null;
  meetingDay: Weekday | null;
  closedAt: string | null;
  activeMemberCount: number;
  leaderMemberId: number | null; // API Stage 1
  leaderName: string | null;     // API Stage 1
}

export interface SmallGroupMember {
  memberId: number;
  memberName: string;
  role: SmallGroupRole;
  joinedAt: string;
}

export interface SmallGroupDetail {
  id: number;
  name: string;
  meetingAddress: string | null;
  meetingDay: Weekday | null;
  closedAt: string | null;
  members: SmallGroupMember[]; // active members only
}

export interface SmallGroupInput {
  name: string;
  meetingAddress?: string | null;
  meetingDay?: Weekday | null;
}
```

| Call | Returns | Errors |
| --- | --- | --- |
| `GET /small-groups` (all groups, open and closed; ordered by name) | `SmallGroupSummary[]` | — |
| `GET /small-groups/{id}` | `SmallGroupDetail` | 404 |
| `POST /small-groups` | 201 + detail | 422 · 429 (20/min) |
| `PATCH /small-groups/{id}` (only changed fields; `null` clears an optional one) | detail | 404 · 409 closed · 422 · 429 (30/min) |
| `POST /small-groups/{id}/close` | detail | 404 · 409 already closed · 429 (10/min) |
| `POST /small-groups/{id}/members` body `{ memberId, role }` (joins today) | 201 + detail | 404 group/member · 409 closed / already in group / already has a leader · 429 |
| `PATCH /small-groups/{id}/members/{memberId}` body `{ role }` | detail | 404 not in group · 409 closed / already has a leader · 429 |
| `PUT /small-groups/{id}/leader` body `{ memberId }` (API Stage 2: demotes the current leader to co-leader and promotes, adding the member if needed, in one transaction) | detail | 404 · 409 closed |
| `DELETE /small-groups/{id}/members/{memberId}` (ends today, kept as history) | 204 | 404 not in group |

The API's 409s all come with English `detail` text and no code; tell them apart by **which call**
returned them, never by parsing the text.

## Stage 1: API client, types and server actions

**Files:** `api/small-groups-api/types.ts`, `api/small-groups-api/client.ts` (new, same shape as
`api/members-api/`), `app/(app)/groups/_lib/` (schema, `load-group.ts`), `app/(app)/groups/_actions/`.

1. Types above; client functions for every call in the table (`listSmallGroups`, `getSmallGroup`,
   `createSmallGroup`, `updateSmallGroup`, `closeSmallGroup`, `addSmallGroupMember`,
   `changeSmallGroupMemberRole`, `setSmallGroupLeader`, `removeSmallGroupMember`).
2. `loadGroup(id)` like `loadMember`: positive-integer check, 404/422 → `notFound()`, `cache()`d.
3. Server actions, each returning `{ ok: true } | { ok: false, error: <code>, message?: string }`
   (never throwing; `getApiErrorMessage()` for anything unexpected):
   - `createGroupAction` / `updateGroupAction` (form; zod-validated; redirect to
     `/groups/{id}?saved=created|updated` on success, PATCH only changed fields, nothing changed →
     back to detail without a request or toast — same rules as the member form);
   - `addGroupMemberAction(groupId, memberId, role)`;
   - `changeGroupMemberRoleAction(groupId, memberId, role)`;
   - `setGroupLeaderAction(groupId, memberId)`;
   - `removeGroupMemberAction(groupId, memberId)`;
   - `closeGroupAction(groupId)`.
   Member actions `revalidatePath("/groups/{id}")`, `/groups` and `/members/{memberId}` (the member
   detail shows their groups); they don't redirect. Map 409s to codes per call:
   add → `alreadyInGroup` / `hasLeader` / `closed`; role → `hasLeader` / `closed`; any → `closed`
   when the group is closed (re-check with the detail if you can't tell).

**Done when:** each action works against the local API from a temporary test; types match.

## Stage 2: Groups list (`/groups`)

**Files:** `app/(app)/groups/page.tsx` (replace the stub) + `_components/`. Keep the existing
`GroupsPage` empty-state messages if they still read right, otherwise replace them.

### Header

Breadcrumb Dashboard › Groups (existing `groupsBreadcrumb`), title "Small groups", description
"Where members meet during the week. Open a group to see its people and manage who leads it."
Primary action **"New group"** (`PlusIcon`) → `/groups/new`.

### Toolbar

- Status tabs **Active / Closed / All** with counts, same component as the Applications status
  filter; default **Active**; kept in the URL (`?status=closed`, `?status=all`) via
  `replaceState`, like Applications.
- Search on the right ("Group, leader or address", `aria-label` "Filter groups"), accent- and
  case-insensitive with `normalizeText()`, matching `name`, `leaderName` and `meetingAddress`.
  Local state, not in the URL.

### Cards

Grid `repeat(auto-fill, minmax(300px, 1fr))`, 16px gap; one column on phone. Each card is a
`card({ interactive: true })` link to `/groups/{id}`:

- 40px soft tile with `UserGroupIcon` + the name (Newsreader 21px). Closed groups also get a
  neutral `StatusBadge` "Closed {date}" under the name.
- A `<dl>` with three rows, 16px muted icons that carry an accessible name (`role="img"` +
  `aria-label`): **Leader** (`UserIcon`) → `leaderName` or "No leader yet"; **Meets**
  (`CalendarIcon`) → "Thursdays" (plural day names) or "Day not set"; **Meeting address**
  (`MapPinIcon`) → the address clamped to 2 lines, or "No meeting address". Missing values in
  `text-subtle`.
- Footer row (top border): "**{n}** members" (ICU plural) and "Open ›".
- Closed cards: `surface-secondary`-ish background, no shadow, name in body color, neutral tile;
  leader reads "No active leader" and the count "— members now".
- Order: API order (by name). In **All**, active groups first, then closed.

### States

- No groups at all → hide toolbar; `EmptyState` "No groups yet" / "Create a group, then add its
  leader and members from the group's page." with an outline action "Create the first group".
- A tab or search with no results → a short muted line ("No groups match your search." / "No closed
  groups.") in place of the grid.
- Loading skeleton: card skeletons in the grid.

Day names (en / es): Mondays…Sundays / Lunes…Domingos ("Meets Thursdays" → "Se reúne los
jueves"); build them from one `Weekday` → message-key map, not by appending "s".

**Done when:** matches `Groups` (active, empty) and `Groups-Dark` (all); tabs and search filter as
specified and the tab survives a reload; 390 shows one column.

## Stage 3: Group detail — read-only parts and closed state (`/groups/{id}`)

**Files:** `app/(app)/groups/[id]/page.tsx`, `loading.tsx`, `_components/`, `config/breadcrumbs.ts`.

### Header

Breadcrumb Groups › {name}. 64px rounded-square tile (18px radius) with `UserGroupIcon`
(accent fill; neutral when closed), the name as `h1`, a neutral "Closed {date}" badge when closed,
and a meta line "Meets **Thursdays** · **{n}** members" (omit the day part when not set; "0 members
now" when closed). Actions: outline "All groups" → `/groups`; primary "Edit details"
(`PencilSquareIcon`) → `/groups/{id}/edit`, **hidden when closed**.

### Members card (left, `flex: 3`)

Eyebrow "People", `h2` "Members", and (active only) an outline **"Add member"** button
(`UserPlusIcon`, opens the dialog in Stage 5). Rows, sorted **leader, co-leaders, members**, then by
name: 36px initials avatar, name linking to `/members/{memberId}`, "Joined {date}" muted, role
`StatusBadge` (Leader = gold/warn tint, filled dot; Co-leader = accent-soft, filled dot; Member =
neutral, hollow dot — same as the member detail), and a 36px ⋯ icon button
(`EllipsisVerticalIcon`, `aria-label` "Actions for {name}") that Stage 5 wires up. Render the ⋯
button only from Stage 5 on.

Active group with no members: inside the card, "No members yet" + "Add the leader and members
with Add member." Closed group: no rows; "This group closed on {date}" + "Its memberships ended
that day. Each person's time in the group stays in their history."

### When & where card (right, `flex: 2`)

Eyebrow "Details", `h2` "When & where", `textLink()` "Edit" (active only). `<dl>` rows with 34px
soft icon tiles: Meeting day ("Thursdays" / "Not set"), Meeting address ("Not set"), Leader (name
linked to the member, or "No leader yet"; closed: "No active leader"), Co-leaders (comma-separated
links, or "None").

### Saved toast

`?saved=created|updated` → "Group created" / "Changes saved" ("Grupo creado" / "Cambios
guardados") via the shared `SavedToast`.

**Done when:** matches `GroupDetail` (`overlay = none`) and `GroupDetail-Closed`; cards stack at
1024 or below as they wrap; unknown or invalid ids show the 404 page.

## Stage 4: Group form (`/groups/new`, `/groups/{id}/edit`)

**Files:** `app/(app)/groups/new/page.tsx`, `app/(app)/groups/[id]/edit/page.tsx`,
`_components/group-form.tsx` (client), `_lib/group-schema.ts`.

| | New | Edit |
| --- | --- | --- |
| Breadcrumb | Groups › New group | Groups › {name} › Edit |
| Title | "New small group" | "Edit group" |
| Description | "Give the group a name and, if you know them, its day and place." | "Update when and where the group meets. Members and roles are managed on the group's page." |
| Submit | "Create group" | "Save changes" |
| Cancel → | `/groups` | `/groups/{id}` |

The edit page for a **closed** group redirects to the detail page (the API would 409 anyway).

One `card()` form, max-width 780px, like the member form; one fieldset (eyebrow "Group", heading
"Name, day and place"):

- **Group name** (required, 1–255 after trim): helper "Usually the people it's for and the
  neighborhood." Error "Enter a name for the group." / "Escribe un nombre para el grupo."
- **Meeting day**: single-select chips `Not set · Mon · Tue · Wed · Thu · Fri · Sat · Sun` (40px,
  10px radius; selected = accent fill), a real radio group (arrow keys move, one tab stop). Helper:
  "Optional. Pick "Not set" if it changes week to week." Sends `1–7` or `null`. Short day labels
  come from `Intl.DateTimeFormat(locale, { weekday: "short" })` or messages — note which.
- **Meeting address** (optional, ≤255): placeholder "Neighborhood, directions, city", helper
  "Optional. Where the group usually meets."
- New only: an info note (accent-soft) "After you create the group, add its leader and members from
  the group's page."
- Footer bar: "* Required", Cancel, submit (pending state). Error alert at the top as in the member
  form ("This group wasn't saved" + count).

**Done when:** matches `GroupForm`, `GroupForm-Edit` and `GroupForm-Dark`; creating lands on the
new group with "Group created"; editing sends only changed fields.

## Stage 5: Member management (on the detail page)

**Files:** `app/(app)/groups/[id]/_components/` (add-member dialog, member row menu, confirm
dialogs). All client components; text passed in as props from the server page where practical,
otherwise one client namespace (e.g. `GroupMembers`).

### Add member dialog (`GroupDetail-AddMember`)

Modal (HeroUI `Modal`/`Dialog`), 520px, title "Add a member", subtitle "To {group}. They join
today."

- **Member** combobox: search by name or email over `GET /members` (load it when the dialog
  opens; filter in the browser with `normalizeText()`), max ~6 results, each with avatar, name and
  email (or "No email"). Members **already in this group** (from the detail) are shown disabled
  with "Already in this group". Keyboard: arrows, Enter selects, Esc closes the list.
- **Role**: segmented radio Member (default) / Co-leader / Leader.
- When the group has a leader, a muted hint under the role: "{leader} leads this group. Choosing
  Leader makes them a co-leader." (no gendered pronoun; "lo/la" avoided in Spanish too).
- Buttons: Cancel, primary "Add to group" (disabled until a member is picked; pending state).
- Submit: role Leader **and** a leader exists → `setGroupLeaderAction` (no extra confirm: the hint
  already said it); otherwise `addGroupMemberAction`. Success → close, toast "{name} added"; error →
  inline alert in the dialog (`alreadyInGroup` → "{name} is already in this group.").

### Row menu (⋯) (`GroupDetail-Dark`)

HeroUI `Dropdown`, 260px, three sections:

1. "Role in this group": radio items Leader / Co-leader / Member with role dot and a check on the
   current one.
2. "View member" (`UserCircleIcon`) → `/members/{memberId}`.
3. "Remove from group" (`UserMinusIcon`), danger text.

Picking a role:
- Same as current → nothing.
- **Leader while someone else leads** → leader-swap confirm (below).
- Otherwise → `changeGroupMemberRoleAction`; toast "Role changed" / "Rol cambiado".
- Demoting the current leader is allowed (the group is then left without a leader); no confirm.

### Confirm dialogs (`GroupDetail-LeaderSwap`, `overlay = remove`)

Extend `ConfirmDialog` with a `tone` (`default` | `danger`): danger shows a danger icon tile and a
danger confirm button (`--danger` fill; text white in light, navy in dark, as on the canvas).

- **Leader swap** (default tone, star icon in a gold tile): "Make {name} the leader?" /
  "{current} leads this group now. They'll become a co-leader and {name} will lead from today. Both
  changes stay in their history." Confirm "Make leader" → `setGroupLeaderAction`; toast "{name} is
  now the leader".
- **Remove** (danger): "Remove {name} from the group?" / "Their membership ends today and stays in
  their history. You can add them back later." Confirm "Remove" → `removeGroupMemberAction`; toast
  "{name} removed from the group".

### Feedback

These actions don't redirect, so use a transient toast (reuse `SavedToast`'s look; make it able to
show from client state, not only from `?saved=`). After each success the page re-renders from the
revalidated data. Errors show as a danger toast or inline alert with the mapped message; a
`closed` error reloads the page so it shows the closed state.

**Done when:** in a local group: add a member, add a co-leader, add a leader with and without an
existing leader, change roles both ways, swap the leader from the menu, remove a member — each
updates the list, the When & where card and the member's own detail page; focus returns to the
⋯ button or the Add member button after a dialog closes; everything works by keyboard alone.

## Stage 6: Close group (`GroupDetail-Close`)

Right column, under When & where (active groups only): a card with a `--danger`-tinted border,
"Close this group", "Ends every membership today. The group stays in the list under Closed, with
its history. This can't be undone." and an outline danger button "Close group…"
(`ArchiveBoxArrowDownIcon`).

Confirm (danger tone): "Close {name}?" / "This ends the membership of all {n} members today and
can't be undone. The group moves to Closed in the list, with its history." ICU plural for `n`
(0 → "This can't be undone. The group moves to Closed…"). Confirm "Close group" →
`closeGroupAction` → stay on the page, which now renders the closed state, toast "Group closed".

**Done when:** closing works, the page and list show the group as closed, and Edit / Add member /
⋯ / Close are gone.

## Stage 7: Links from elsewhere + docs

- **Member detail** (`/members/{id}`): the group names in "Current groups & roles" become links to
  `/groups/{smallGroupId}` (MEMBER-DETAIL-AND-FORM.md left them as plain text until this existed).
- **Dashboard**: the "No groups yet" placeholder card shows only when there are no active groups;
  otherwise leave it out (or a small "{n} active groups" link to `/groups` — note what you chose).
  Don't build anything bigger there in this spec.
- `CLAUDE.md` → *Overview*: groups has list, detail with member management, and add/edit.
- Mark the stages above done and finish *Decisions and deviations*.

## Not in this spec

- Meeting **time** (the API has no field; see the API handoff's open questions).
- Showing a member's *other* groups in the add-member search.
- Group reports (`/groups/reports`) and reopening a closed group.
