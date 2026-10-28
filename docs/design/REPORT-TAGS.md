# Report items and tags, person timeline: report form, read views, Profile · Timeline tabs

Implementation spec for **report items, person tags and the person timeline**. Read the cross-repo
spec first: `../docs/specs/report-tags.md` (workspace folder `members-management/docs/specs/`); its
rules are referred to as *rule N*. After this work:

- **Report form** (`/groups/reports/new`, `/groups/reports/[id]/edit`): *Prayer requests*,
  *Praise* and *For the elders to follow up* are lists of items. An item can tag members and guests
  with `@` or the row's `@` button.
- **Report detail, Prayer & follow-up, the conversation panel:** items as a list, tagged people as
  chips; *Copy for WhatsApp* one line per item.
- **Member detail and Guest detail** (Part 2): **Profile · Timeline** tabs, a *Recent activity* card
  on Profile, and a Timeline tab (`/members/[id]/timeline`, `/guests/[id]/timeline`) with date,
  group and type filters.

**Decided:** everything in the cross-repo spec's *Rules*, plus these UI decisions (don't reopen):

- **One editor per item, in a notepad box per section** (revised Oct 26, stage 5b; the earlier
  bordered-editor-per-item design is gone). The three sections always stack in one column
  (`max-w-[760px]`): no grid. Each section's `<ol>` is one bordered box and its items are rows
  separated by a hairline. A row is a single-line rich field with no border of its own (wraps
  visually, no line breaks inside), its number in the left gutter, and a 40 px *Tag someone* (`@`)
  and a 40 px *Remove item* (×) at the end, shown on row hover or focus (always, at 44 px, on touch).
  The last row is a ghost row (+ and the section's placeholder) that adds an item; it's hidden while
  the last item is empty and at 20 items. A section can be empty. The legend is the title,
  *(optional)* and the count of non-empty items. The numbers are hidden below `md`.
- **Enter** in an item splits it at the caret into the next item and moves focus there.
  **Backspace** at the start of an item merges it into the previous one (an empty item is removed).
  **Paste** with line breaks inserts one item per line (rule 2).
- **Chips are atomic** in the editor: the caret moves over them, Backspace after a chip removes the
  whole chip, they can't be edited letter by letter.
- **Picker:** on desktop a popover under the item (400 px max), on phones a bottom sheet with its
  own search field. With `@` the query is what's typed after it (no search field on desktop);
  with the row's `@` button the popover has a search field. `↑`/`↓` move, Enter picks, Esc closes and
  leaves `@pab` as plain text. Group headings in the eyebrow style. First option highlighted.
- **Rich-text library:** use **TipTap** (`@tiptap/react`, `@tiptap/pm`, `@tiptap/extension-document`,
  `-paragraph`, `-text`, `-mention`, `-placeholder`), one editor instance per item, mention nodes
  rendered as chips. Don't hand-roll `contentEditable`. If TipTap turns out to be a poor fit with
  HeroUI or Next 16, stop and say so in the progress log before choosing something else.
- **Tabs are links**, not a client tab widget: two `<Link>`s styled as tabs with
  `aria-current="page"`, a 3 px gold underline on the current one. Each tab is its own route, so
  the browser's Back works and links can be shared.
- **New component names:** `components/person_timeline/` already exists (the membership
  application's assimilation events: baptism, classes). Don't touch it and don't reuse its name.
  The new one is `components/report-timeline/`.
- *Show 3 more months* turns the range into a custom range starting 3 months earlier (the Dates
  select then shows *Custom range* with the dates). The board keeps the preset's label; this is
  simpler and keeps the URL honest.

**Depends on the API:** `membership-management/docs/REPORT-TAGS-API-HANDOFF.md`. Part 1 here needs
its stages 1–4 running locally; Part 2 here needs its stages 6–7. Its stage 5 (dropping the old
text fields) lands **after** this repo's Part 1 is deployed, and this repo must not read the old
fields any more by then (stage 1 below removes every use). If a stage starts before the API is
ready, note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage: Part 1 on the **`report-tags`**
branch, Part 2 on **`person-timeline`**. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, in English and Spanish,
as a leader and as an elder, before the next one starts. After each stage, write a short summary of
what changed and anything that differs from the canvas in the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page **"Tagging people"**, its four rows and its two blue notes. Report form boards are clickable
  in Play (pick a person, *Tag someone*, the ghost row, remove); so are the person pages (tabs) and
  the timeline boards (filters, chips, *Show 3 more months*, the phone sheet).
- **Boards:**
  - Form: `ReportForm-Tags` (group step, typing `@Pab`: *In Jóvenes Bello Horizonte* with Pablo
    absent in amber, then *Everyone else in the church* with a member and a guest),
    `ReportForm-Tags-Edit-Elder` (elder edits an older report: the banner, one item per section,
    *Tag someone* open on *Named in this item*), `ReportForm-Tags-Phone` (the picker as a sheet),
    `ReportForm-Tags-Phone-Dark-ES`. Tweaks on the `ReportForm` component: `tags`
    (`none`/`at`/`button`), `legacy`, `user` (`leader`/`elder`), plus the usual mode, lang, size,
    step, kind. The existing `ReportForm-*` boards on page "Small group reports" show items too.
  - Read views: `ReportDetail-Tags`, `PrayerFollowUp-Tags` (last week: Bello Horizonte's items,
    Altamira's untagged "a couple in the group" item). `ReportDetail-*`, `PrayerFollowUp-*` and
    `ThreadPanel` (section topics) on the other pages follow the same rendering.
  - Person pages: `MemberDetail-Activity` (Profile tab, Recent activity at the top of the right
    column), `MemberDetail-Timeline`, `GuestDetail-Activity` (replaces *Recent meetings*),
    `GuestDetail-Timeline`, `GuestDetail-Activity-Leader`, `GuestDetail-Timeline-Leader`.
  - Timeline card: `PersonTimeline` (component; tweaks `variant` `full`/`preview`, `viewer`,
    `person`, `range`, `group`, `filter`, `size`, `sheet`), `PersonTimeline-Filtered` (custom range
    + one group), `PersonTimeline-Phone-Filters` (the sheet), `PersonTimeline-Phone-Dark-ES`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced from `tokens/`.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| **Part 1 (`report-tags`)** | | |
| 1. API types and client; drop every use of the old text fields | ✅ | `d384e40` |
| 2. The item editor (`ReportItemsField`), without tags | ✅ | `0fa22c4` |
| 3. Tags: chips, `@` picker, person button, phone sheet | ✅ | `e9e1f93` |
| 4. Report form wiring: group step, list step, edit, draft, older reports | ✅ | `763aaed` |
| 5. Read views: Report detail, conversation panel, Prayer & follow-up, WhatsApp | ✅ | `8ebd362` |
| 5b. Stacked notepad layout for the three sections (canvas revision of Oct 26) | ✅ | `bd57083` |
| **Part 2 (`person-timeline`)** | | |
| 6. Types, client and `components/report-timeline/` (rows, chips, month headings) | ✅ | `c6c1ced` |
| 7. Tabs and Recent activity on Member and Guest detail | ✅ | STAGE7 |
| 8. The Timeline tab: filters, URL, *Show 3 more months*, phone sheet | ⬜ | |
| 9. Docs and design review fixes | ⬜ | |

**Where to resume (Part 1 is deployed; Part 2 is on the `person-timeline` branch, next is stage 7):**

- Still open: touch (`(hover: none)`, needs a real phone or tablet), an elder session, and the
  design review checklist against the canvas boards (Claude Design is doing the canvas comparison;
  record its findings in the progress log). 422 `items` can't be reached from the UI (the form caps at
  20 items and 10 tags first), so it isn't a check. Everything else was checked on Oct 27, see
  "Final checks of Part 1" and "Legacy banner removed" below.
- Nothing needs setting at deploy: the `ITEMS_SINCE` date is gone. The API's stage 5 (dropping the old
  text fields) must come after Part 1 is deployed.
- Then Part 2 on a new `person-timeline` branch from stage 6. It needs the API's stages 6–7 first
  (timeline service and routes, still ⬜ in `membership-management`), done in a separate session there.

**Checking in the browser (the work happens on both a Mac and a Windows machine):**

- Start the dev server on the machine the session runs on (`pnpm dev`, port 3001); it also needs the
  API (8000) and auth-server (5000) there.
- Claude in Chrome can list a Chrome on each machine (`list_connected_browsers`). Use the one on the
  **same computer as the dev server**: the other one gets `ERR_CONNECTION_REFUSED` on `localhost`, and
  its sign-in isn't the one you made here. Ask which one rather than guessing.
- Sign in as admin yourself (the password can't be typed for you). The page doesn't resize the window:
  for 390 / 1024, load the page in a same-origin `<iframe>` of that width. `(hover: none)` can't be
  emulated.
- Report ids differ per database: open a report from `/groups/reports` rather than assuming one.

### Decisions and deviations

- **Stage 1.** Types (`ReportSegment`, `ReportItem`, `ReportSections`, `ReportSectionsInput`,
  `TaggablePerson`), `searchTaggablePeople` and its server action
  (`_actions/tag-search-action.ts`, needs `smallGroupReports` create *or* update), `lib/report-items.ts`
  (`segmentsToPlain`, `shortNames`, `splitLegacyText`, `toPersonKey`) and
  `reportSectionItems` / `sectionHasItems` / `sectionPlainLines` in `lib/report-sections.ts`. The old
  text fields are gone from the types, so `tsc` found every reader. 422 `tag` / `items` map to
  `ReportItems.errorTag` / `errorLimit` in `getApiErrorMessage` (the items phrases are checked first:
  "Too many items or *tags*…" also contains "tag").
- **Stage 1, temporary until stage 4.** The report draft is still three strings: `toReportInput` splits
  them into untagged items (rule 2) and the edit form joins items back into lines with people by full
  name, so editing a tagged report flattens its tags until stage 4. Read views show items as plain
  lines until stage 5. Nothing visible changes except line breaks becoming separate items.
- **Stage 2.** TipTap 3.32 (`@tiptap/react`, `pm`, `core`, `extension-document/paragraph/text/placeholder`,
  `@tiptap/suggestion` for stage 3; `extension-mention` was dropped) fits Next 16 / React 19:
  `immediatelyRender: false`, no HeroUI conflict (the field box is plain classes with the field tokens).
  One editor per item (`report-item-editor.tsx`, single-paragraph document, length filter at 1024
  counting text only until chips exist). The parent (`report-items-field.tsx`) owns the list; the editor
  hands up Enter / multi-line paste as one `ItemBreak` (`parts` + caret) and Backspace-at-start as
  `onMergeUp`; focus moves by a `focusRequest` prop so a freshly mounted editor still gets it. Draft
  model in `_lib/report-items-draft.ts` (`DraftItem { key, segments }`, people keep their full name).
  `ReportItemsFields` renders the three sections (`stacked` / `grid`); the group step's tip line comes
  with the wiring in stage 4. Not wired into any page yet, so nothing changes for users.
- **Stage 2, checked** in the browser on a throwaway route (not committed): typing, Enter mid-text
  splits and focuses the new item, Backspace at the start merges (and removes an empty item), a pasted
  `- uno / • dos / 3) tres` becomes items without markers. Remove-item focus and the 20-item limit were
  read through, not exercised.
- **Stage 3.** Own TipTap node `personTag` (inline atom, React node view rendering
  `ReportPersonChip`, labels from `ShortNamesContext` so *Pablo S.* works inside the editor) instead of
  `extension-mention` (not installed; `@tiptap/suggestion` does the `@` trigger with `allowSpaces`). The editor owns its picker state: `@` mode reads the
  suggestion's query, button mode has a search field. Desktop picker is portalled and fixed to the
  field's rectangle (cards with `overflow-hidden` can't clip it); phone is a HeroUI
  `Modal` with `placement="bottom"`. Roster sections are built on the client from a `TagContext`
  (`_lib/report-tags.ts`; stage 4 builds it from the roster and answers), church-wide results through
  `searchTaggablePeopleAction`, debounced 200 ms with a stale-answer guard. Limits (1024 characters
  with tokens, 10 tags) are a ProseMirror `filterTransaction`.
- **Stage 3, differences from the spec.** The "second space with no match" end of an `@` query is
  approximated as "more than two words and nothing matches". Extra copy keys: `limitTags`,
  `searchError`, `searching`, `close`. A guest on the roster shows the group's name instead of a role
  in the sub-line (their roster role is always `member`; found while testing as a leader).
- **Stage 3, checked** in the browser on the throwaway route: `@pab` lists the roster (amber *missed
  this meeting*), ↑↓ Enter picks and leaves the caret after the chip, the person button opens with
  *Named in this item* first and Enter turns the written *Gabriela* into the chip, the same picker as a
  bottom sheet in a 390 px frame. **Not exercised here:** the church-wide search (it needs a signed-in
  session and the API), the screen-reader announcements, Backspace over a chip.
- **Stage 4.** `ReportDraft` now holds `items: DraftItems` (segments; people keep their full name).
  Older drafts (three strings) are split into items on load (`withItems` in `report-draft.ts`).
  `toReportInput` sends `sections`, dropping empty items. Group step: the tip line (accent-soft box,
  at-symbol icon) then three stacked `ReportItemsField`s; list step and edit: `grid`. The picker's
  roster comes from `tagContextOf` (people on the report plus their current answers, so a guest added
  mid-flow can be tagged at once). `group-fields.tsx` is deleted. Edit form: items from
  `report.sections`. (The legacy banner and its `ITEMS_SINCE` date were removed on Oct 27: see
  "Legacy banner removed" below.) The stage 1 shim (strings ⇄ items) is gone, so editing a tagged report keeps its tags.
- **Stage 4, not verified against the API.** The local API is the `report-tags` branch, but the dev
  database is still at migration `e73b39f55d6b` (branch head is `c19ca7f78d85`), so
  `GET /small-group-reports/{id}` answers 500 there. I didn't migrate your dev database. Create / edit /
  tag search / the 422 texts still need a run after `uv run alembic upgrade head` (or against a scratch
  DB). Checked only: lint, `tsc`, and the editor and picker on a throwaway route (stages 2–3).
- **Stage 5.** `report-item-list.tsx` (gold dot, segments, `ReportPersonChip`; a chip is a link only
  when `viewable`, via `personHref` in `lib/person-href.ts`: Part 2 changes that one line to the
  Timeline tab). Report detail lists items per section (sans body, no italic serif; chip names worked
  out across all three sections); conversation indicators show when a section has items or a thread.
  The conversation panel's anchor carries `items` instead of `text` (14.5 px; its chip names come from
  that section only). Prayer & follow-up: `sectionEntries` returns items, entries render the list
  (`max-w-[72ch]`), `searchText` adds tagged people's full names (rule 16). WhatsApp: `• ` + item, tagged
  people as first names, one line per item, for one entry and for *Copy all* (comment in
  `whatsapp-text.ts` updated).
- **After the dev database was migrated (checked in the browser, nothing saved):** Report detail shows
  items with gold dots; the edit form loads a seeded report as items; `@kev` in an item returns
  church-wide rows (guest pill, role · group) through the server action and tag-search endpoint.
  Still **not exercised**: saving (create/edit) and the 422 texts, a report with tagged chips on detail /
  panel / Prayer & follow-up, the WhatsApp text. (The 3-column grid this note was about is gone: stage 5b.)
- **Saved and read back against the local API (report 5 edited twice, tags added through `@`):**
  save + redirect works; Report detail and the `?section=followUp` panel show the chip (a link to
  `/members/49` for the admin); Prayer & follow-up finds the report by the tagged person's name
  (rule 16); *Copy for WhatsApp* (one entry and *Copy all*) writes `• ` lines with first names only.
  The 422 `tag` path was checked too: member 40 was marked inactive, then picked from the September
  roster (the picker still lists people on the report) in a new section; the save answers with
  `ReportItems.errorTag` and the form keeps its draft. A guest-group leader was checked too: roster + church-wide
  tagging works, and on the saved report (id 52) the guest in their scope is a link (`/guests/11`) while a
  member of another group is a plain chip (rule 12). Not exercised: 422 `items`, a member-group
  leader, light mode, 1024 / 390 on the read views.
- **Stage 5, was not verified in the browser** (same reason as stage 4: the dev API 500s on reports until
  its database is migrated). Lint and `tsc` pass. After migrating, check: a report with tagged items on
  Report detail, `?section=` panel, Prayer & follow-up search for a tagged name, and the copied text.
- **Part 1 not yet checked at 1440 / 1024 / 390, light and dark, leader and elder** against the canvas
  (I couldn't open the canvas page; the build follows the spec text and the notes above). Do that
  review once the API answers.
- **Stacked notepad layout (canvas revision, Oct 26).** The 3-column grid is gone: `ReportItemsFields`
  always stacks the sections in one column (`max-w-[760px]`, `gap-7`) and has no `layout` prop (only
  `group-step.tsx` and `report-list-step.tsx` passed one; the edit form reuses `ReportListStep`). Each
  section is a notepad: the `<ol>` is the box (`field-border`, `rounded-xl`, `bg-field`,
  `divide-separator`, focus ring on `focus-within`), the editor has no border of its own, and the row being
  edited gets `bg-surface-secondary/40`. The row's buttons are a 40 px `@` button (`AtSymbolIcon`,
  replaces the person-plus icon) and a 40 px remove ×, hidden until the row is hovered or has focus
  (`ROW_BUTTON` in `report-item-editor.tsx`; still in the tab order, visible when focused or while the
  picker is open), always visible at 44 px under `(hover: none)`. The tag button stays in the editor
  (it owns the picker state) and the remove button is passed in as `trailing`; the picker now anchors to
  the whole row. *Add another* is replaced by a ghost row (+ in the gutter, the section's placeholder in
  `text-subtle`), hidden while the last item is empty and at 20 items (the limit text then shows under the
  box). A section can have zero items; removing the last one focuses the ghost row. The legend is one
  line: title, *(optional)* and the count of non-empty items. Copy: `ReportItems.count` added,
  `ReportItems.tip` reworded, `ReportItems.addItem` and the three `ReportForm.*Hint` keys removed (no
  other reader). Keyboard and paste behavior unchanged. Checked in the browser as admin on the edit form
  of report 52 (ES): 1406 px light, dark, and a 390 px frame in dark; 1024 px light (no horizontal
  scroll at 390 or 1024). The ghost row adds and focuses an item, the box gets the focus ring, `@` and ×
  show on hover. Also checked on a new report (as admin, ES and EN, light and dark): the group step, the
  list step and the review step (the review wasn't submitted), `@Ana` + Enter makes the chip, the row's `@`
  button opens the search picker under the row (aligned with the text) and Esc returns focus to the item.
  Fixes that came out of it: the empty row's placeholder is one truncated line (the box's `overflow-hidden`
  clipped its second line at 390), the count never wraps, and each editor is keyed by its placeholder
  because TipTap reads it once, so switching language in place left empty items on the old language.
  **Still not exercised:** touch itself (the `(hover: none)` rules compile to `size-11` and
  `opacity: 1`, but the browser can't emulate it), a pasted multi-line block in the new box, elder and
  leader sessions. A fresh draft starts each section with one empty item (the zero-item box only appears
  after removing the last one).
- **Final checks of Part 1 (Oct 27, dev server on the Mac, Chrome on the same Mac).** As admin: a
  multi-line paste (`- uno / • dos / 3) tres`) makes three items without markers, no horizontal scroll
  at 400 px, the picker as a bottom sheet at 400 px. As a member-group co-leader (GP - #1; I added them
  by inserting a `small_group_members` row in the dev DB): create with quick list, church-wide `@`
  search, chips disambiguated (*Kevin Ú.* / *Kevin M.*, rule 11), save, edit round trip keeps the tags and
  shows no banner, and a member of another group and a guest outside their scope are plain chips
  (rule 12). As a guest-group leader (Nuevos Comienzos): the guest in their group is a link
  (`/guests/<id>`), the roster picker lists *At this meeting* with the group's name for guests, and
  editing and saving a tagged item works. **Changed:** a paste with more lines than the section has room
  for used to merge the overflow into the last item that fits (`punto 20punto 21…`); now the whole paste
  is refused and the `limitItems` text shows (`role="status"`) until the list changes. Test data left in
  the dev DB: reports 53 (GP - #1) and an added praise item on report 52, and the co-leader row. Still
  open: touch, elder session and the canvas comparison.
- **Legacy banner removed (Oct 27).** The edit form no longer says that an older report "came over as
  one item per line" (`ReportItems.legacyBanner`, `ITEMS_SINCE`, `_lib/items-since.ts`): with a few
  users and two weeks of reports it wasn't worth a date to set at deploy. Older reports still open as
  one untagged item per line. If a large import ever needs the note back, have the API backfill mark
  converted reports instead of comparing dates.
- **Canvas review fixes (Oct 27, from Claude Design).** Item numbers and the ghost row use `text-muted`
  instead of `text-subtle` (subtle is decorative: ~2.6–2.9:1; measured 6.14:1 dark, 5.87:1 light; the
  empty-item placeholder was already `text-field-placeholder` = ink-muted). The legend count shows only
  when a section has a non-empty item. Item text is 15px (`text-[15px]`, `leading-[1.55]`); the ghost
  row went to 15px as well so its text lines up with an item's placeholder. The `role="status"` limit
  line is always mounted (`empty:hidden`) and only its text changes, so screen readers announce it.
  Checked on the edit form as a guest-group leader: dark and light at 1792, 390 in an iframe (no
  sideways scroll), a 25-line paste fills the status text. Not re-checked in Spanish (the locale cookie
  I set didn't switch it; same code path). The picker's roster-guest sub-line is unchanged on purpose.
- **Width.** The edit form, the list step and the review wrapper no longer cap at 1000 px (they follow
  the shell's `max-w-7xl`), so the three item columns are ~334 px each at 1792 instead of ~165. The
  meeting and group steps keep their 720 px. Reported by the user while reviewing.
- **Stage 6 (Part 2, Oct 28).** The API's stages 6–7 are done in `membership-management`. Types
  (`PersonTimeline`, `TimelineRow`, `TimelineItem`, `TimelineParams`…) are in `small-groups-api/types.ts`;
  `getMemberTimeline` / `getGuestTimeline` live in the members and guests clients and share
  `timelineQuery` (in the small-groups client). `components/report-timeline/`: `ReportTimeline`
  (`full` groups rows under `TimelineMonth` headings; `preview` is a bare list), `TimelineRow`
  (date as `Thu, Oct 8`, group link, role / attendance `StatusBadge`s or the *Tagged in this report*
  pill, a note block, one block per section with only the items tagging the person, own chip
  highlighted and not a link, *View report*) and `skeleton.tsx`. Copy: the whole `ReportTimeline`
  namespace is added in both languages now (the filter keys are used in stage 8). It stays out of
  `CLIENT_NAMESPACES` until stage 8 needs it. Choices: *View report* adds `?section=followUp` only for a
  row whose visible content is follow-up items alone; `formatCalendarMonth` added for the headings.
  The card header, the preview's footer line and *See full timeline* belong to stages 7–8, where the
  page knows the viewer. **Not checked in the browser:** nothing renders it until stage 7 wires a page.
  `personHref` still points at the Profile page; stage 7 changes that one line once the tab exists.
- **Stage 7 (Part 2, Oct 28).** `components/person-tabs.tsx` (two links, `aria-current`, gold
  underline), `Profile`/`Timeline` on both pages, new `/members/[id]/timeline` and
  `/guests/[id]/timeline` (same `requirePermission` / `requireGuests`, same header, a 404 from the
  timeline call is the page's 404). `RecentActivityCard` (3 newest rows, *See full timeline*, footer by
  viewer) is the top of the right column on both Profiles and is left out when empty or when the call
  fails; `guest-meetings-card.tsx` and its `GuestMeetingsCard` messages are deleted.
  `TimelineCard` is the Timeline tab for now (heading, description, rows by month, audience note; no
  filters until stage 8). `timelineViewer(permissions)` in `lib/auth/permissions.ts` picks the
  elder / leader wording (`smallGroups: all` + `viewObservations`). `personHref` now goes to the Timeline
  tab. The headers are rendered by each page, not a shared loader: the Profile pages already hold
  the data, and the timeline pages repeat only the few permission lines.
  **Checked in the browser as admin** (dev server on the Mac, Chrome on the same Mac): member 49
  Profile and Timeline (light 1502 px, dark in a 390 px frame, no sideways scroll), guest 11 Profile
  (dark) with a follow-up block, the lock note and a second chip beside the highlighted one; both guest
  routes answer 200. **Not checked:** Spanish, 1024 px, a leader session, an elder who isn't admin.
  Known roughness: the *Tagged in this report* pill wraps to two lines in the preview's 150 px column.
- **Stage 1, checked:** `pnpm lint` (only a warning in `member-form.tsx`, untouched), `tsc --noEmit`.

## Token changes

None. Everything uses existing tokens:

- Member chip: `bg-accent-soft text-accent-soft-foreground`, `rounded-md`, `font-semibold`,
  `text-[0.92em]`, horizontal padding 6 px. Guest chip: transparent, `border border-field-border`,
  the `HandRaisedIcon` in `text-eyebrow` at 12 px (as `GuestsBadge`). The highlighted chip on the
  timeline (the person whose page it is): `bg-accent text-accent-foreground`.
- Item dot in read views: `bg-gold-500` 6 px (the gold is decorative, never text).
- Active tab underline: the gold the canvas uses for the conversation focus edge (look for the
  existing class; if it's a raw brand class there, keep it the same way).
- Month headings on the timeline: the table header background `dataTable()` uses.

New Tailwind utilities needed: none.

## The API

All from `membership-management/docs/REPORT-TAGS-API-HANDOFF.md` and the spec's *Contracts*.

**Part 1**

- `ReportDetail.sections` and each shared entry's `sections`: `Record<ReportSectionKey,
  ReportItem[]>`, `ReportItem = { id: number; segments: ReportSegment[] }`,
  `ReportSegment = { type: "text"; text: string } | { type: "person"; person: Person & { viewable:
  boolean } }`.
- `ReportInput.sections: Record<ReportSectionKey, { segments: ReportSegmentInput[] }[]>`, where a
  person segment sends only `{ type, id }`. **Always send `sections`.** Remove `groupPrayerRequest`,
  `groupPraiseReport`, `groupRelevantDiscussion` (and the shared entry's `prayer` / `praise` /
  `followUp` strings) from the types in stage 1, so `tsc` finds every reader.
- `GET /small-groups/{id}/tag-search?q=` → `searchTaggablePeople(groupId, q)`:
  `{ person, inThisGroup, groups: { id, name, audience, role }[], phoneLast4 }[]`. Called from the
  client through a server action (as `search-members.ts` does), debounced ~200 ms, only for 2+
  characters, cancelled when a newer query starts.
- Errors (status → message key): 422 `tag` → `ReportItems.errorTag` (*Someone you tagged can't be
  tagged any more. Remove the tag and try again.*), 422 `items` → `ReportItems.errorLimit`. The rest
  as today.

**Part 2**

- `getMemberTimeline(id, { from, to, smallGroupId })`, `getGuestTimeline(…)`, and `{ latest: 3 }`
  for Recent activity. Shape in the spec. 422 `range` → `ReportTimeline.errorRange` (shouldn't
  happen from the UI: the date inputs have `max` = today, and *From*/*To* are validated before the
  URL changes).

## Part 1

### Stage 1: API types and client

**Files:** `api/small-groups-api/types.ts`, `client.ts`, `lib/report-sections.ts`,
`app/(app)/groups/reports/_lib/report-body.ts`, `app/(app)/groups/reports/_actions/`.

- Types and client functions above. `lib/report-sections.ts`: `reportSectionText` becomes
  `reportSectionItems(report, key): ReportItem[]` and a `sectionHasItems` helper (a section thread
  can start when it has items, rule 18).
- New `lib/report-items.ts`: `segmentsToPlain(segments, { names: "first" | "full" })` (WhatsApp
  and search), `shortNames(items)` (rule 11: first name, plus last initial when two different
  people in the same report share a first name; returns a `Map<PersonKey, string>`).
- Fix every place that read the old fields so the app still builds and behaves the same, rendering
  items as plain lines for now (stage 5 does the real rendering). Nothing visible should change yet
  except line breaks becoming separate lines.

### Stage 2: the item editor, without tags

> Superseded in part by stage 5b (see **Decided** and *Decisions*): the per-item border, the
> `layout` prop / grid and *Add another* below are gone. Read this stage for the behavior (keyboard,
> limits, aria), not the look.

**Files:** `app/(app)/groups/reports/_components/report-items-field.tsx` (new),
`report-item-editor.tsx` (new, the TipTap instance). Replaces `group-fields.tsx` in stage 4.

- `ReportItemsField({ section, items, onChange, layout })`: a `<fieldset>` with the section label
  (*(optional)* after it) and hint as the legend, an `<ol>` of items, and *Add another*. `layout`
  `stacked` (group step) or `grid` (list step and edit: three columns from `md`, `align-items:
  start`).
- Each item: number (`md+`, `text-subtle`, tabular), the editor (44 px min height, field border,
  focus ring as other fields, placeholder per section: *Add a prayer request…* / *Add something to
  be thankful for…* / *Add a point for the elders…*), the person button (stage 3 wires it), and
  *Remove item* (hidden when it's the only, empty item; a spacer keeps the column aligned).
- Keyboard and paste behavior as **Decided**. After *Add another*, focus the new item. After
  *Remove item*, focus the previous item (or the next, or *Add another*).
- Each editor is `role="textbox"` with `aria-multiline="false"` and `aria-label` "{Section}, item
  {n}". Limits: 20 items (then *Add another* is disabled with a hint), 1024 characters per item (a
  quiet counter appears at 900+, as the old field's counter).
- The section's tip line under the group step's intro: *One item per request: press Enter to start
  the next. Type @ or use a row's @ button to tag a member or guest, from any group.* (accent-soft
  box with the at-symbol icon, as the board).

### Stage 3: tags

**Files:** `report-item-editor.tsx`, `tag-picker.tsx` (new, desktop popover), `tag-picker-sheet.tsx`
(new, phone), `report-person-chip.tsx` (new, shared by the editor and the read views).

- **Chip** (`ReportPersonChip`): short name from `shortNames`, `title` and `aria-label` the full
  name (+ *, guest*), member/guest styles from *Token changes*. In the editor a chip is a TipTap
  mention node (`atom: true`).
- **`@` trigger:** typing `@` after a space or at the start opens the picker with the text after it
  as the query. The query ends at Esc, a click outside, or a second space with no match. Picking
  replaces `@query` with the chip followed by a space.
- **Person button:** opens the same picker on that item, with a search field (autofocused). With
  an empty field: *Named in this item* then *At this meeting* (rule 9; words matched with
  `normalizeText`, so *José* matches *jose*). Picking a name that's already written turns the first
  plain occurrence of that first name into the chip; otherwise the chip goes at the caret (the end
  if the editor wasn't focused).
- **Results** (rule 8): build *At this meeting* and *In {group}* from the roster and the draft's
  answers on the client (no request), filtered by the query; add *Everyone else in the church*
  from `searchTaggablePeople` without people already listed. Each option: avatar initials (guests:
  outline avatar), full name, a sub-line (members: role and group, or *Member · not in a group*;
  people on this roster: role and *came* / *missed this meeting* in `text-warning-soft-foreground`
  / *not marked yet*; guests: group and *phone ···4821*), and the `GuestsBadge` with label
  *Guest* for guests. Hide people already tagged in this item. No results: *No member or guest
  matches “{q}”. Leave it as plain text.* Footer (desktop): *Not listed? Leave it as plain text.
  ↑ ↓ to move, Enter to tag, Esc to close.*
- **Accessibility:** the editor is the combobox owner while the picker is open
  (`aria-expanded`, `aria-controls`, `aria-activedescendant` on the editor); options are
  `role="option"` in a `role="listbox"` with group labels (`role="group"` + `aria-label`). The
  phone sheet is a modal dialog (focus trapped, focus returns to the item when it closes).
- **Phone:** the picker is a bottom sheet (scrim, grabber, *Tag someone* title with "{Section},
  item {n}" under it, close button, a 48 px search field prefilled with the `@` query, 56 px
  rows, a footer *Not listed? Leave the name as plain text. Members of any group and guests can be
  tagged.*). Board `ReportForm-Tags-Phone`.

### Stage 4: report form wiring

> Layout superseded by stage 5b: every step stacks the three sections in one column.

**Files:** `group-step.tsx`, `report-list-step.tsx`, `edit-report-form.tsx`, `report-flow.tsx`,
`_lib/report-draft.ts`, `_lib/report-body.ts`, `_lib/report-schema.ts`, delete `group-fields.tsx`.

- Group step: three `ReportItemsField`s, `stacked`. List step and edit: `grid`.
- **Draft:** `prayer` / `praise` / `discussion` strings become `items: Record<ReportSectionKey,
  DraftItem[]>` (`DraftItem` = TipTap JSON or our own segments; segments are simpler to validate:
  prefer them). Older drafts (strings) are split into items on load (rule 2), like
  `withPersonKeys` migrates older answers. Drafts with tags keep the person's full name too, so the
  chip renders before any request.
- `toReportInput` sends `sections`, dropping empty items, never the old fields.
- **Edit form:** items come from `report.sections`. No banner for older reports (dropped, see
  *Decisions*). Elders editing use the same form (board `ReportForm-Tags-Edit-Elder`).
- Errors: 422 `tag` / `items` show as the form's error toast with the message keys above; the form
  keeps the draft.

### Stage 5: read views

**Files:** `report-shared-card.tsx`, `conversation-panel.tsx` (section context box),
`app/(app)/_components/prayer/prayer-entry.tsx`, `prayer-types.ts`, `whatsapp-text.ts`.

- **Item list** (new `report-item-list.tsx`): `<ul>`, each item a row with a 6 px gold dot and the
  segments; chips via `ReportPersonChip`; a chip with `viewable` is a `<Link>` to
  `/members/{id}/timeline` or `/guests/{id}/timeline` (Profile until Part 2 ships: use a helper
  `personHref(person)` so Part 2 changes one line), otherwise a `<span>`. Body text 15.5 px,
  `text-pretty`, `max-w-[72ch]` on Prayer & follow-up. Report detail drops the italic serif for the
  section text (the board uses the sans body with chips).
- **Report detail:** each section of *What the group shared* renders its items; *Nothing shared
  this week.* when none. Conversation indicators unchanged, shown when the section has items or a
  thread.
- **Conversation panel:** the section context box lists the items (14.5 px).
- **Prayer & follow-up:** each entry lists its items. `searchText` also includes the full names of
  tagged people (rule 16).
- **WhatsApp:** `whatsappEntryText` / `whatsappAllText` write one line per item, `• ` + the item
  with first names (`segmentsToPlain(…, { names: "first" })`), rule 17. Update the code comment
  that shows the format.

## Part 2

### Stage 6: types, client, `components/report-timeline/`

**Files:** `api/members-api/`, `api/guests-api/` (types, client), `components/report-timeline/`
(`report-timeline.tsx`, `timeline-row.tsx`, `timeline-month.tsx`, `skeleton.tsx`).

- `ReportTimeline` renders rows grouped by month (heading: month and year, uppercase eyebrow size,
  *N reports* on the right, the table header background). A row: date (`EEE, MMM d`, the viewer's
  language), group link, role or the *Tagged in this report* outline pill (at-symbol icon),
  attendance pills (`StatusBadge`-style: *Came* / *Didn't come*, *At church Sunday* / *Not at
  church*), then blocks: *Note from {submitter}* (pencil tile, neutral; *Elders and the group's
  leaders* with a lock), *Prayer request* (heart tile, accent-soft), *Praise* (sparkles, success),
  *For the elders to follow up* (flag, warning; *Elders and the group's leaders* with a lock). Reuse
  `components/report-section-tile.tsx` for the tiles. Then *View report* →
  `/groups/reports/{id}` (for follow-up items `?section=followUp`).
- The person's own chip uses the highlighted style and isn't a link; other chips follow `viewable`.
- `variant="preview"`: header *Recent activity* + *See full timeline* (link to the Timeline tab), no
  filters, no month headings, no *View report*, the date column 150 px, and a footer line (*The last
  3 reports Lucía was on or tagged in. Notes and follow-up are private to elders and the group's
  leaders.*; leaders: *The last 3 reports you can see. Notes and follow-up only from the groups you
  lead.*).

### Stage 7: tabs and Recent activity

**Files:** `app/(app)/members/[id]/page.tsx`, `app/(app)/members/[id]/timeline/page.tsx` (new),
`_components/person-tabs.tsx` (new, shared by members and guests; put it in `components/`),
`app/(app)/guests/[id]/page.tsx`, `app/(app)/guests/[id]/timeline/page.tsx` (new),
`guest-meetings-card.tsx` (removed from the page).

- Tabs under the header on both pages (*Profile* / *Timeline*; ES *Perfil* / *Historial*), `<nav
  aria-label="{person name}">`, links with `aria-current="page"`. Both routes load the header the
  same way (extract what `page.tsx` does today into a loader both use).
- Member Profile: `ReportTimeline variant="preview"` at the top of the right column, from
  `getMemberTimeline(id, { latest: 3 })`; hidden when there are no rows. Guest Profile: the same,
  replacing *Recent meetings* (delete `guest-meetings-card.tsx` if nothing else uses it).
- Access: the same `requirePermission` and loaders as the Profile page; a 404 from the timeline
  call means the page's own 404.
- Loading: the existing `loading.tsx` per route, plus `components/report-timeline/skeleton.tsx`.

### Stage 8: the Timeline tab

**Files:** `timeline/page.tsx` (both), `components/report-timeline/timeline-filters.tsx`,
`timeline-filters-sheet.tsx`, `timeline-type-chips.tsx`.

- Header block in the card: eyebrow *From small group reports*, title *Timeline*, the one-line
  description (elder / leader versions on the board).
- **Dates** (`Select`): *Last 3 months* (default), *Last 6 months*, *This year*, *Custom range…*.
  Custom shows *From* and *To* date fields (`max` = church today; *From* ≤ *To*; at most 2 years,
  otherwise an inline error and the URL doesn't change). **Group** (`Select`): *All groups* and the
  response's `groups`. Both in the URL (`?range=`, `?from=`, `?to=`, `?group=`) and server-rendered;
  changing one navigates (`router.replace`, scroll kept).
- **Type chips:** *All*, *Notes*, *Prayer*, *Praise*, *Follow-up*, counts from `counts`, page state (`useState`), as on Prayer & follow-up. A type hides
  rows without that kind of block.
- **Summary** line (`role="status"`): *11 reports · Jul 16 – Oct 15, 2026* (· group name).
- **Footer:** *Show 3 more months* (when `earliestDate` is before `from`) or the end text (rule
  22: member / guest / leader versions), plus the audience note with the eye icon.
- **Empty:** *Nothing in these dates* / *Try a longer range or another group.*
- **Phone:** one *Filters* button (sliders icon, *Filters* and the current range · group under it)
  opening a bottom sheet with the date presets as large toggle rows and the group select, and *Show
  N reports*; the type chips scroll sideways (`overflow-x-auto`, no wrap). Board
  `PersonTimeline-Phone-Filters`.

### Stage 9: docs and design review

- `CLAUDE.md`: one line under the overview (items and tags, the report timeline, `components/report-timeline/` vs `components/person_timeline/`).
- This file's progress log; the design review checklist below.

## Copy

New namespaces `ReportItems`, `ReportTimeline`, `PersonTabs`; additions to `ReportForm`,
`ReportDetail`, `PrayerDashboard`. Keep each key's ICU plural where there's a count. The editor and
picker are client components, so `ReportItems` goes in `CLIENT_NAMESPACES`; the timeline's filters
and chips are client too (`ReportTimeline`). Pass the few labels a client piece needs as props where
that's simpler (CLAUDE.md, *Adding UI text*).

| Namespace.key | English | Español |
| --- | --- | --- |
| `ReportItems.tip` | One item per request: press Enter to start the next. Type @ or use a row's @ button to tag a member or guest, from any group. | Un punto por petición: presiona Enter para empezar el siguiente. Escribe @ o usa el botón @ de la fila para etiquetar a un miembro o invitado, de cualquier grupo. |
| `ReportItems.count` | {count, plural, one {# item} other {# items}} | {count, plural, one {# punto} other {# puntos}} |
| `ReportItems.itemLabel` | {section}, item {n} | {section}, punto {n} |
| `ReportItems.removeItem` | Remove item {n}: {section} | Quitar punto {n}: {section} |
| `ReportItems.tagSomeone` | Tag someone | Etiquetar a alguien |
| `ReportItems.placeholderPrayer` | Add a prayer request… | Agrega una petición de oración… |
| `ReportItems.placeholderPraise` | Add something to be thankful for… | Agrega un motivo de gratitud… |
| `ReportItems.placeholderFollowUp` | Add a point for the elders… | Agrega un punto para los ancianos… |
| `ReportItems.search` | Search members and guests | Buscar miembros e invitados |
| `ReportItems.matching` | People matching “{q}” | Personas que coinciden con “{q}” |
| `ReportItems.namedHere` | Named in this item | Nombrados en este punto |
| `ReportItems.atMeeting` | At this meeting | En esta reunión |
| `ReportItems.inGroup` | In {group} | En {group} |
| `ReportItems.restOfChurch` | Everyone else in the church | Resto de la iglesia |
| `ReportItems.came` / `missed` / `notMarked` | came / missed this meeting / not marked yet | vino / faltó a esta reunión / sin marcar |
| `ReportItems.noGroup` | Member · not in a group | Miembro · sin grupo |
| `ReportItems.phoneLast4` | phone ···{digits} | tel. ···{digits} |
| `ReportItems.guest` | Guest | Invitado |
| `ReportItems.chipGuest` | {name}, guest | {name}, invitado |
| `ReportItems.none` | No member or guest matches “{q}”. Leave it as plain text. | Ningún miembro o invitado coincide con “{q}”. Déjalo como texto. |
| `ReportItems.footer` | Not listed? Leave it as plain text. ↑ ↓ to move, Enter to tag, Esc to close. | ¿No aparece? Déjalo como texto. ↑ ↓ para moverte, Enter para etiquetar, Esc para cerrar. |
| `ReportItems.footerPhone` | Not listed? Leave the name as plain text. Members of any group and guests can be tagged. | ¿No aparece? Deja el nombre como texto. Puedes etiquetar miembros de cualquier grupo e invitados. |
| `ReportItems.limitItems` | Up to 20 items per section. | Hasta 20 puntos por sección. |
| `ReportItems.errorTag` | Someone you tagged can't be tagged any more. Remove the tag and try again. | Alguien que etiquetaste ya no se puede etiquetar. Quita la etiqueta e inténtalo de nuevo. |
| `ReportItems.errorLimit` | A section has too many items or an item has too many tags. | Una sección tiene demasiados puntos o un punto tiene demasiadas etiquetas. |
| `PersonTabs.profile` / `timeline` | Profile / Timeline | Perfil / Historial |
| `ReportTimeline.eyebrow` | From small group reports | De los reportes de grupos |
| `ReportTimeline.title` / `recent` | Timeline / Recent activity | Historial / Actividad reciente |
| `ReportTimeline.seeAll` | See full timeline | Ver historial completo |
| `ReportTimeline.dates` / `group` / `from` / `to` / `filters` | Dates / Group / From / To / Filters | Fechas / Grupo / Desde / Hasta / Filtros |
| `ReportTimeline.range3m` / `range6m` / `rangeYear` / `rangeCustom` | Last 3 months / Last 6 months / This year / Custom range… | Últimos 3 meses / Últimos 6 meses / Este año / Rango personalizado… |
| `ReportTimeline.allGroups` | All groups | Todos los grupos |
| `ReportTimeline.typeAll` / `typeNotes` / `typePrayer` / `typePraise` / `typeFollowUp` | All / Notes / Prayer / Praise / Follow-up | Todo / Notas / Oración / Alabanza / Seguimiento |
| `ReportTimeline.summary` | {count, plural, one {# report} other {# reports}} · {range} | {count, plural, one {# reporte} other {# reportes}} · {range} |
| `ReportTimeline.monthCount` | {count, plural, one {# report} other {# reports}} | {count, plural, one {# reporte} other {# reportes}} |
| `ReportTimeline.taggedOnly` | Tagged in this report | Etiquetado en este reporte |
| `ReportTimeline.came` / `didntCome` / `atChurch` / `notAtChurch` | Came / Didn’t come / At church Sunday / Not at church | Vino / No vino / En la iglesia el domingo / No fue a la iglesia |
| `ReportTimeline.noteFrom` | Note from {name} | Nota de {name} |
| `ReportTimeline.notePrivate` | Elders and the group’s leaders | Ancianos y líderes del grupo |
| `ReportTimeline.followPrivate` | Elders and the group’s leaders | Ancianos y líderes del grupo |
| `ReportTimeline.prayer` / `praise` / `followUp` | Prayer request / Praise / For the elders to follow up | Petición de oración / Motivo de alabanza / Para seguimiento de los ancianos |
| `ReportTimeline.viewReport` | View report | Ver reporte |
| `ReportTimeline.showMore` | Show 3 more months | Ver 3 meses más |
| `ReportTimeline.endMember` / `endGuest` / `endLeader` | That’s everything since {name}’s first report. / That’s everything since {name}’s first visit, {date}. / That’s everything you can see for {name}. | Eso es todo desde el primer reporte de {name}. / Eso es todo desde la primera visita de {name}, el {date}. / Eso es todo lo que puedes ver de {name}. |
| `ReportTimeline.subElder` | Every meeting {name} was on the attendance list, and every item a report tagged them in, from any group. Newest first. | Cada reunión en la que {name} estuvo en la lista de asistencia y cada punto en que un reporte lo etiquetó, de cualquier grupo. Lo más reciente primero. |
| `ReportTimeline.subLeader` | Meetings of your groups, and prayer and praise items that tagged {name} in any group’s report. | Las reuniones de tus grupos y las peticiones y alabanzas en que un reporte de cualquier grupo etiquetó a {name}. |
| `ReportTimeline.footElder` | Notes and follow-up are seen by admins, elders and that group’s leaders. Leaders of {name}’s current groups also see prayer and praise from any group. | Las notas y el seguimiento los ven administradores, ancianos y los líderes de ese grupo. Los líderes de los grupos actuales de {name} también ven las peticiones y alabanzas de cualquier grupo. |
| `ReportTimeline.footLeader` | You see notes and follow-up only from the groups you lead; prayer and praise from any group. {name} never sees this page. | Ves las notas y el seguimiento solo de los grupos que lideras; las peticiones y alabanzas, de cualquier grupo. {name} nunca ve esta página. |
| `ReportTimeline.previewFootElder` / `previewFootLeader` | The last 3 reports {name} was on or tagged in. Notes and follow-up are private to elders and the group’s leaders. / The last 3 reports you can see. Notes and follow-up only from the groups you lead. | Los últimos 3 reportes en que {name} estuvo o fue etiquetado. Las notas y el seguimiento son privados para ancianos y líderes del grupo. / Los últimos 3 reportes que puedes ver. Notas y seguimiento solo de los grupos que lideras. |
| `ReportTimeline.emptyTitle` / `emptyBody` | Nothing in these dates / Try a longer range or another group. | Nada en estas fechas / Prueba con un rango más largo u otro grupo. |
| `ReportTimeline.showReports` | Show {count, plural, one {# report} other {# reports}} | Ver {count, plural, one {# reporte} other {# reportes}} |
| `ReportTimeline.errorRange` | Pick a range of up to 2 years that doesn’t end in the future. | Elige un rango de hasta 2 años que no termine en el futuro. |

The board's Spanish uses the feminine (*etiquetada*) because both sample people are women; the
keys above use the masculine as the default. If you want gendered copy, `members.sex` exists for
members (guests have it too): use an ICU `select` and note it in *Decisions*.

## Not in this spec

- Notifications, export, printing, LLM tag suggestions and summaries (spec rule 25).
- Merging the assimilation events (`components/person_timeline/`: baptism, classes) into the report
  timeline. Worth doing later; it needs its own design.
- Stable item ids, per-item threads, "answered" flags.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways (except the timeline's type
      chips on phones, on purpose); the picker becomes a sheet on phones.
- [ ] The editor: Enter, Backspace, paste and chips behave as **Decided**; a screen reader announces
      the item, the open picker, the highlighted option and the inserted chip.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Token changes: none; `pnpm tokens --check` passes.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] Focus ring visible on every control; focus after adding, removing and tagging items, and
      after closing the picker and the filters sheet, makes sense.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
