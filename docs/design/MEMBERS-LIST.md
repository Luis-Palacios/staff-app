# Members list

Implementation spec for a new **Members** section: a top-level sidebar item right below
**Dashboard** (no nested items) that opens `/members`, a list of the church's members.
The member detail page is **out of scope**; each row gets an "Open" action that will lead
to it.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`members-list`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, before the
next one starts. After each stage, write a short summary of what changed and anything that
differs from the canvas in the *Decisions and deviations* section below, so it can be
reviewed.

- **Approved design (source of truth for look):** Claude Design canvas "ekklesiaio Staff
  App" https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1. Artboards:
  - `Members` (light; its `state` prop switches between `list` and `empty`),
    `Members-Dark`.
  - `Sidebar` — now has the Members item (`active="members"` shows it selected).
  - Read artboards with the Artifact tool's `read` and `path: "project/<Name>.dc.html"`.
    They hold exact px values and colors. Names, emails and phones on the canvas are
    illustration only.
- **Brand rules:** unchanged. Read `docs/design/BRAND-RESTYLE.md` → *Principles* before
  every stage.
- **Pattern to copy:** the Applications list (`app/(app)/applications/`). Members is the same
  page shape with fewer columns and no status filter. Reuse the shared pieces
  (`StaffAppPageHeader`, `dataTable()` + `DataTablePrimaryCell` + `DataTableOpenLink` +
  `DataTableFooter`, `card()`, `EmptyState`, the table/card skeletons) — don't restyle HeroUI
  inline.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Nav item, route and API client | ✅ done | `f473bfe` |
| 2. Members list (table, cards, search, states) | ✅ done | `a660e62` |
| 3. Docs | [ ] | |

### Decisions and deviations

- **API client** lives in a new `api/members-api/` (`client.ts`, `types.ts`), same shape as
  `applications-membership-api`. `APPLICATIONS_MEMBERSHIP_API_URL` is the same FastAPI service,
  so no new env var.
- **`normalize()`** moved to `lib/normalize-text.ts` (`normalizeText`) and the applications
  browser now imports it.
- **Empty state** is decided in the server `MembersList` (`[]` → `EmptyState`), so the
  `MembersEmpty` namespace stays server-only; `MembersBrowser` is the only new client namespace.
- **Count** is a `t.rich` message with a `<num>` tag (bold, `text-heading`) and doubles as the
  `aria-live` announcement, so there's no separate sr-only line as on Applications.
- Rows keep API order. Not checked in a browser (no signed-in session / backend here): verify
  light/dark at 1440 / 1024 / 390 by hand.

## The API (membership-management, already built)

`GET /members` — router `membership-management/src/membership_management/api/routers/members.py`,
schema `MemberSummarySchema`. JWT-protected like the other membership routes, so call it
through `authenticatedFetch`. Responses are camelCase (`CamelModel`).

```ts
// GET /members → MemberSummary[]
export interface MemberSummary {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}
```

- **No query parameters**: no search, no pagination, no sort. The whole list comes back in
  one call; filtering runs in the browser, as on Applications.
- `GET /members/{id}` (detail, with `address`, `birthDate`, `smallGroups`) exists too, but
  this spec doesn't use it.

## Stage 1: Nav item, route and API client

**Files:** `config/site.ts`, `components/sidebar.tsx`, `config/breadcrumbs.ts`,
`messages/en.json`, `messages/es.json`, `api/members-api/` (new) or the existing membership
client (see below), `app/(app)/members/page.tsx` (new).

1. **Nav** (`config/site.ts`): add a leaf item **between `dashboard` and `groups`**:
   `{ labelKey: "members", icon: "members", href: "/members" }`. Add `"members"` to
   `NavIconName`.
2. **Icon** (`components/sidebar.tsx`): register `members: UsersIcon` (Heroicons outline) in
   `iconRegistry`. Groups keeps `UserGroupIcon`. (The canvas's Groups icon was corrected to
   `UserGroupIcon` in the same update, so both now match the code.)
3. **Messages**: `Nav.members` = "Members" / "Miembros".
4. **Breadcrumb** (`config/breadcrumbs.ts`): `membersBreadcrumb = { labelKey: "members", href: "/members" }`.
5. **API client**: the members endpoint lives on the same FastAPI service as applications.
   Check that `APPLICATIONS_MEMBERSHIP_API_URL` is that service's base URL; if so reuse it
   (don't add a new env var). Add `MemberSummary` to a types file and a
   `listMembers(): Promise<MemberSummary[]>` that calls `/members`. Put it where it reads
   best: either alongside `api/applications-membership-api/client.ts` or in a new
   `api/members-api/` folder with the same shape — note the choice under *Decisions*.
6. **Page stub** (`app/(app)/members/page.tsx`): `StaffAppPageHeader` with
   `breadcrumbs={[membersBreadcrumb]}`, title and description from a new `MembersPage`
   namespace:
   - `title`: "Members" / "Miembros"
   - `description`: "Everyone who is a member of this church. Open one to see their details
     and small groups." / "Todas las personas que son miembros de esta iglesia. Abre uno para
     ver sus datos y sus grupos pequeños."

**Done when:** the sidebar shows Members under Dashboard on desktop and in the off-canvas
menu below `lg`; it is highlighted (navy-700 row, gold icon, white text) on `/members` and
not elsewhere; the breadcrumb reads Dashboard › Members; the page header renders in both
languages.

## Stage 2: Members list

**Files (new, under `app/(app)/members/_components/`):** `members-list.tsx` (server, fetches),
`members-browser.tsx` (client, search + layout), `members-summary-table.tsx` (md and up),
`member-card-summary.tsx` (below md), `members-list-skeleton.tsx`. Page wraps the list in
`<Suspense fallback={<MembersListSkeleton />}>`, exactly like Applications.

### Toolbar

- Search field (same `TextField` + `InputGroup` as `applications-browser.tsx`), ~340px wide
  on desktop, full width on phone. Placeholder "Name, email or phone" /
  "Nombre, correo o teléfono"; `aria-label` "Filter members" / "Filtrar miembros".
- Matching: reuse the accent- and case-insensitive `normalize()` from the applications
  browser (move it to `lib/` if you'd otherwise copy it — note it). A member matches when the
  query is found in `name` or `email`; for `phone`, compare digits only (strip spaces, `+`,
  `-`), so "8812" finds "+505 8812 3401".
- Next to the search: the count, "**{count}** members" (ICU plural; bold number in
  `text-heading`). It shows the filtered count.
- Search state stays local (`useState`), not in the URL; there is no status filter.

### Table (from `md` up)

`dataTable()` with `variant="secondary"`, `min-w-[760px]`, `aria-label` "Members".
Columns:

| Column | Content |
| --- | --- |
| **Member** (row header) | `DataTablePrimaryCell` — initials avatar, name linked to `/members/{id}`, secondary line "Member #{id}" / "Miembro #{id}" |
| **Email** | the email in body text; `null` → "Not provided" / "No registrado" in `text-subtle` |
| **Phone** | the phone, `whitespace-nowrap`; `null` → same "Not provided" treatment |
| *(actions, sr-only header)* | `DataTableOpenLink` to `/members/{id}`, `label` = "Open {name}" / "Abrir {name}" |

- Rows in API order (don't re-sort in the client unless the API order is unusable; note it
  if you do).
- Footer: `DataTableFooter total={filtered.length}` (buttons stay disabled; the API doesn't
  paginate).
- No-matches: the table's `renderEmptyState` shows "No members match your search." /
  "Ningún miembro coincide con tu búsqueda."

### Cards (below `md`)

One `card({ interactive: true })` per member linking to `/members/{id}`: initials avatar,
name (semibold), "Member #{id}" muted, then email and phone each on its own line (muted,
truncate; omit a line when the value is `null`). Same pattern as `ApplicationCardSummary`.

### States

- **Empty** (API returns `[]`): hide the toolbar and table; show `EmptyState` with
  `UsersIcon`, title "No members yet" / "Aún no hay miembros", body "Members will show up
  here once they're added to this church." / "Los miembros aparecerán aquí cuando se agreguen
  a esta iglesia." Matches the canvas `Members` artboard with `state = empty`.
- **Loading**: `MembersListSkeleton` built from `components/skeleton/` (table from `md`,
  cards below).
- **Error**: let it throw to `app/(app)/error.tsx`, as Applications does.

### Member detail link

`/members/{id}` doesn't exist yet, so the name link and "Open" will 404 until the detail
page is built. That's expected for this spec — don't add a placeholder page or disable the
links.

**Done when:** the list matches the `Members` / `Members-Dark` artboards at 1440; the table
scrolls horizontally inside its card at 1024 if needed; cards at 390; search filters by
name (accent-insensitive), email and phone digits; the count and footer follow the filter;
empty and no-matches states render in both languages; `messages/parity.ts` passes.

## Stage 3: Docs

> Closed. The list's "Open" links now reach the member detail page (`/members/{id}`).

- `CLAUDE.md` → *Overview*: mention `members` among the sections that have real UI.
- Mark the stages done in the table above with their commits, and finish *Decisions and
  deviations*.
