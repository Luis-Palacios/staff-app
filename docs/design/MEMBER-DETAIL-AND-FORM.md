# Member detail and add/edit form

Implementation spec for the next step of the Members section (follows
`docs/design/MEMBERS-LIST.md`):

- an **Add member** entry point on the Members page, its empty state and the dashboard;
- a **read-only member detail page** at `/members/{id}`;
- one **add/edit form**, used at `/members/new` and `/members/{id}/edit`.

**Why detail and edit are separate pages (decided):** the detail page will keep growing with
information that is *not* editable from this form (current small groups and roles today, more
later). The form holds only the five fields the API lets us change: `name`, `email`, `phone`,
`address`, `birthDate`. Small groups and roles are never part of this form; they're managed from
each group.

Work through it **stage by stage**, one reviewable commit per stage, on the
**`member-detail-form`** branch. Each stage must lint (`pnpm lint`), type-check
(`pnpm exec tsc --noEmit`) and work in light and dark, at 1440 / 1024 / 390, before the next one
starts. After each stage, write a short summary of what changed and anything that differs from
the canvas in *Decisions and deviations* below, so it can be reviewed.

- **Approved design (source of truth for look):** Claude Design canvas "ekklesiaio Staff App"
  https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1. Artboards:
  - `Members` — header "Add member" button; with `state = empty`, the "Add the first member"
    action.
  - `Dashboard` — outline "Add member" button next to "Invite staff".
  - `MemberDetail` (props: `groups` = `some` | `none`, `toast` = `none` | `created` |
    `updated`), `MemberDetail-Dark` (shows the saved toast).
  - `MemberForm` (props: `variant` = `new` | `edit`, `state` = `default` | `errors` |
    `picker`). Wrappers: `MemberForm-Edit` (edit, light), `MemberForm-Errors` (new, validation
    errors), `MemberForm-Dark` (edit, dark, country picker open).
  - Read artboards with the Artifact tool's `read` and `path: "project/<Name>.dc.html"`. They
    hold exact px values and colors. Names, addresses, phones and groups on the canvas are
    illustration only.
- **Brand rules:** unchanged. Read `docs/design/BRAND-RESTYLE.md` → *Principles* before every
  stage (theme tokens for page content, gold never carries text on a light background, focus is
  the gold halo, no new component-level `dark:` overrides). Error red is the existing `--danger`
  token (`#B42318` light / `#FDA29B` dark).
- **Patterns to reuse:** `StaffAppPageHeader`, `card()`, `title()`, `textLink()`,
  `StatusBadge`-style pill, `InitialsAvatar`, `EmptyState`, the skeletons; the HeroUI v3 form
  pieces already used in `new-invite-form.tsx` (`TextField`, `InputGroup`, `Label`, `Select`,
  `ListBox`, `Button`). Check the current HeroUI v3 docs for any component not used yet
  (`ComboBox`, `DateField`/`DatePicker`, `Toast`); don't assume v2 APIs.
- **UI text:** everything through next-intl, English + Spanish in the same change (see
  `CLAUDE.md` → *Adding UI text*). Suggested Spanish is given below; adjust wording if the
  existing glossary differs, and note it.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API client and server actions | [x] | `032b2c8` |
| 2. Add member entry points | [x] | `e748122` |
| 3. Member detail page | [x] | `16ead5f` |
| 4. Add/edit form | [x] | `71e5325` |
| 5. Docs | [x] | this commit |

### Decisions and deviations

- **Not checked visually.** No session or running API was available, so none of the stages
  was compared with the canvas or tried in light/dark at 1440 / 1024 / 390. `pnpm lint` and
  `tsc --noEmit` pass. Do that review before merging.
- **Stage 1:** the schema (`_lib/member-schema.ts`) is validated on `memberSchema` for create and
  `memberChangesSchema` (partial) for update. `updateMemberAction` takes only the changed fields;
  an empty optional becomes `null`. 409 → `fieldErrors.email = "emailDuplicate"`; other errors use
  the existing `getApiErrorMessage()` (no new 409/422 case).
- **Stage 3:** `loadMember()` (`_lib/load-member.ts`, `cache()`d) does the fetch and `notFound()`
  on 404, shared with the edit page. Loading state is `[id]/loading.tsx` rather than a `Suspense`
  inside the page, so an unknown id still gets a real 404. Date-only values use the new
  `formatCalendarDate()` (UTC) and `ageFromCalendarDate()` in `lib/format-date.ts`. The toast is a
  small client component (`saved-toast.tsx`), not HeroUI's. The neutral role pill uses
  `StatusBadge`'s `neutral` tone (`bg-default text-muted`), not `surface-secondary` + body text.
- **Stage 4 deviations:**
  - Birth date is a styled-looking native `<input type="date">`: `@internationalized/date` is not
    a dependency, and I didn't add one. Its order follows the browser's language, not the picker.
  - The country picker is a HeroUI `Select` (arrows, type-to-jump, Esc), **without** the search
    field: nine countries. Add a `ComboBox` if the list grows.
  - Phone number separators `- ( ) .` are accepted and turned into single spaces; letters or other
    characters give "Use only numbers.". "Other" skips that check and keeps the value untouched.
  - No unsaved-changes confirmation; I think it's fine for a five-field form.
  - Spanish: "Cómo contactarle", "Dirección y cumpleaños" as given; "Correo", "Teléfono",
    "Fecha de nacimiento" for the labels.

## The API (membership-management, already built)

Router `membership-management/src/membership_management/api/routers/members.py`, schemas in
`api/schemas/members.py`. JWT-protected; call it through `authenticatedFetch` with
`APPLICATIONS_MEMBERSHIP_API_URL` (same service as `listMembers()`). camelCase JSON.

```ts
export type SmallGroupRole = "member" | "leader" | "co_leader";

export interface MemberSmallGroup {
  smallGroupId: number;
  smallGroupName: string;
  role: SmallGroupRole;
  joinedAt: string; // date only, "YYYY-MM-DD"
}

export interface MemberDetail extends MemberSummary {
  address: string | null;
  birthDate: string | null; // date only, "YYYY-MM-DD"
  smallGroups: MemberSmallGroup[]; // current (active) groups only
}

export interface MemberInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
}
```

| Call | Returns | Errors |
| --- | --- | --- |
| `GET /members/{id}` | `MemberDetail` | 404 not found |
| `POST /members` (body `MemberInput`, `name` required) | 201 + `MemberDetail` | 409 duplicate email · 422 validation · 429 (20/min) |
| `PATCH /members/{id}` (only the fields that changed; `null` clears an optional one) | `MemberDetail` | 404 · 409 duplicate email · 422 (incl. `name: null`) · 429 (30/min) |

Server-side limits (mirror them in the client schema): `name` 1–255 chars after trim, `email` a
valid address, `phone` 1–20 chars, `address` 1–255 chars. Empty strings are not valid for the
optional fields: send `null` (PATCH) or omit them (POST) instead. There is **no DELETE**; the UI
has no delete action.

## Stage 1: API client and server actions

**Files:** `api/members-api/types.ts`, `api/members-api/client.ts`,
`app/(app)/members/_actions/` (new).

1. Add the types above to `types.ts`.
2. In `client.ts`: `getMember(id: string): Promise<MemberDetail>`,
   `createMember(input: MemberInput): Promise<MemberDetail>` (`method: "POST"`),
   `updateMember(id: string, changes: Partial<MemberInput>): Promise<MemberDetail>`
   (`method: "PATCH"`).
3. Server actions (`"use server"`), e.g. `createMemberAction` and `updateMemberAction`:
   - Validate again on the server with the same zod schema as the form (Stage 4 defines it; put
     it in a shared file such as `app/(app)/members/_lib/member-schema.ts` that both sides
     import). `zod` is already a dependency.
   - On success: `revalidatePath("/members")` (and `/members/{id}` on update), then `redirect`
     to `/members/{id}?saved=created` or `?saved=updated` (see the toast in Stage 3).
   - On failure, **return** a result instead of throwing (Next hides thrown messages in
     production; `switch-church.ts` does the same):
     `{ ok: false, fieldErrors?: { email?: "duplicate"; … }, formError?: string }`.
     409 → `fieldErrors.email = "duplicate"`. Anything else → `formError` from
     `getApiErrorMessage()` (add a 409/422 case there only if it reads better; never show the
     backend's English `detail`).

**Done when:** the actions can be called from a temporary test and the three API calls work
against the running API; types match the schemas.

## Stage 2: Add member entry points

**Files:** `app/(app)/members/page.tsx`, the members empty state, the dashboard page header.

- **Members page header:** `StaffAppPageHeader` `actions` = a primary link button "Add member"
  (`UserPlusIcon`, 18px) → `/members/new`. Same look as the dashboard's "Invite staff" (navy in
  light, gold with navy text in dark).
- **Empty state** (`MembersEmpty`): add the `EmptyState` `action` — outline button with
  `PlusIcon` "Add the first member" → `/members/new`.
- **Dashboard:** an **outline** "Add member" link button (`UserPlusIcon`) to the **left** of
  "Invite staff", in the same actions row; both wrap on phone. "Invite staff" stays the primary.
- Use a shared message for the label (e.g. `Members.addMember`) so the three places stay in
  sync.

Copy: "Add member" / "Agregar miembro" · "Add the first member" / "Agrega el primer miembro".

**Done when:** the three links render as on the `Members` and `Dashboard` artboards in both
themes and go to `/members/new` (a 404 until Stage 4 is fine).

## Stage 3: Member detail page (`/members/{id}`)

**Files:** `app/(app)/members/[id]/page.tsx` + `_components/`, `config/breadcrumbs.ts`.

Server component: `getMember(id)`; a 404 `ApiError` → `notFound()`; other errors go to
`app/(app)/error.tsx`. Wrap the content in `Suspense` with a skeleton, like the application
detail page.

### Header

Breadcrumb **Members › {name}** (data crumb). Then, as on `ApplicationDetail`: 64px initials
avatar (accent fill: navy/white light, gold/navy dark), the name as the page `h1`, and a meta
line: "Member **#{id}**" · "**{n}** small groups" (ICU plural, `0` reads "0 small groups").
Actions on the right (wrap below on phone): outline "All members" (`ArrowLeftIcon`) →
`/members`, primary "Edit details" (`PencilSquareIcon`) → `/members/{id}/edit`.

### Contact & personal card (left, `flex: 2`)

Card header: eyebrow "Profile", `h2` "Contact & personal", and a `textLink()` "Edit" →
`/members/{id}/edit` (`aria-label` "Edit contact and personal details"). Below, a `<dl>` with
one row per field, each row: 34px soft icon tile (Heroicons outline) + label (12.5px semibold
muted) + value (15px body):

| Field | Icon | Value |
| --- | --- | --- |
| Email | `EnvelopeIcon` | the address |
| Phone | `PhoneIcon` | the stored string as is |
| Address | `MapPinIcon` | the address, wraps |
| Birth date | `CakeIcon` | long date in the UI locale + a muted second line "{age} years old" |

`null` → "Not provided" in `text-subtle`. Plain text, not `mailto:`/`tel:` links (decide in
review if you think links help).

**Dates are date-only.** `birthDate` and `joinedAt` are `"YYYY-MM-DD"`. Don't pass them through
`new Date(iso)` + the time-zone formatters in `lib/format-date.ts`; that can shift a day.
Format them as calendar dates (e.g. parse to year/month/day and format with `timeZone: "UTC"`,
or add a `formatCalendarDate()` helper to `lib/format-date.ts`), and note what you chose.

### Current groups & roles card (right, `flex: 3`)

Eyebrow "Small groups", `h2` "Current groups & roles". One row per `smallGroups` item: 40px
soft tile with `UserGroupIcon`, group name (15px semibold), "Joined {date}" muted, and a role
pill on the right (`StatusBadge` look: dot + word):

| `role` | Label (en / es) | Colors |
| --- | --- | --- |
| `leader` | Leader / Líder | warn tint (gold) — filled dot |
| `co_leader` | Co-leader / Colíder | accent-soft (navy tint) — filled dot |
| `member` | Member / Miembro | neutral (`surface-secondary`, body text) — hollow dot |

Group names are user data (not translated) and are **not links** yet (the groups pages are
stubs); make them links when group detail exists. Empty list → inside the card: "Not in a small
group yet" (15px semibold) + "Groups and roles show up here when they join one." (muted).

### Saved toast

When the URL has `?saved=created` or `?saved=updated`, show a toast bottom-right: navy surface
(`#13325A` in dark), white text 14px semibold, green check icon (`#8EDDB4`), 12px radius,
float shadow; text "Member added" / "Changes saved" ("Miembro agregado" / "Cambios guardados").
`role="status"`. Use HeroUI v3's toast if it fits; otherwise a small client component.
Auto-dismiss after ~4 s and drop the param with `history.replaceState` so a reload doesn't
show it again.

Copy (en / es): "All members" / "Todos los miembros" · "Edit details" / "Editar datos" ·
"Profile" / "Perfil" · "Contact & personal" / "Contacto y datos personales" · "Current groups &
roles" / "Grupos y roles actuales" · "Not provided" / "No registrado" · "{age} years old" /
"{age} años" · "Joined {date}" / "Se unió el {date}".

**Done when:** it matches `MemberDetail` (both `groups` states) and `MemberDetail-Dark` at 1440;
cards stack at 1024 or below as they wrap; 390 works; unknown id shows the 404 page; the toast
appears once after a save.

## Stage 4: Add/edit form (`/members/new`, `/members/{id}/edit`)

**Files:** `app/(app)/members/new/page.tsx`, `app/(app)/members/[id]/edit/page.tsx`,
`app/(app)/members/_components/member-form.tsx` (client, shared), `phone-field.tsx`,
`_lib/member-schema.ts`, `lib/phone-countries.ts` (or under `_lib/`).

### Pages

| | New | Edit |
| --- | --- | --- |
| Breadcrumb | Members › Add member | Members › {name} › Edit |
| Title | "Add a member" | "Edit member" |
| Description | "Add someone who is already a member of this church. Only the name is required." | "Update {firstName}'s contact and personal details. Small groups and roles are managed from each group." |
| Submit | "Add member" | "Save changes" |
| Cancel → | `/members` | `/members/{id}` |

The edit page loads `getMember(id)` on the server (404 → `notFound()`) and passes the editable
fields to the form. `{firstName}` = the first word of `name`.

Spanish: "Agregar miembro" (crumb and submit), "Agrega un miembro", "Agrega a alguien que ya es
miembro de esta iglesia. Solo el nombre es obligatorio.", "Editar miembro", "Actualiza los datos
de contacto y personales de {firstName}. Los grupos pequeños y los roles se administran desde
cada grupo.", "Guardar cambios", "Cancelar".

### Layout

One `card()` form, **max-width 780px**, left-aligned under the header. Two `<fieldset>`s, each
with a `<legend>` made of an eyebrow + Newsreader 22px heading, separated by a `border-separator`
line:

1. **Contact** — "How to reach them" ("Cómo contactarle"): **Full name** (full width,
   required, `autocomplete="name"`), then **Email** and **Phone** side by side (a 2-column grid
   with `minmax(260px, 1fr)` columns; they stack on narrow screens).
2. **Personal** — "Address and birthday" ("Dirección y cumpleaños"): **Address** (full width,
   one line, placeholder "Neighborhood, directions, city"), then **Birth date** (half width).

Footer bar inside the card (`bg-surface-secondary/50`, top border, bottom corners rounded):
"* Required" on the left (asterisk in `text-danger`), outline **Cancel** and primary submit on
the right; they wrap on phone. The submit shows a pending state while the action runs and the
form is disabled meanwhile.

Labels 13px semibold heading; inputs 40px, 10px radius, `field-border`; helper text 13px muted
below a field: Email "Optional. Each member needs their own." ("Opcional. Cada miembro necesita
el suyo."), Phone "Optional. Pick the country, then type the number." ("Opcional. Elige el país
y escribe el número."), Birth date "Optional." ("Opcional.").

### Phone field (country picker + number)

One bordered 40px group: a **country button** on the left (bordered 26×18 ISO tag such as
`NI`, the dial code `+505` in 14px semibold tabular, chevron; a right border separates it), and
a `type="tel"` input for the national number (`autocomplete="tel-national"`, placeholder
"8888 8888"). Focus shows the gold halo on the whole group.

The button opens a popover (300px, 16px radius, float shadow, `overlay-border`) with a search
field ("Search country or code") and a single-select listbox: ISO tag, country name, dial code
in muted, check on the selected one (`text-accent`). The HeroUI v3 `ComboBox` or a
`Select`/`Popover` + `ListBox` both fit; pick what keeps keyboard support (arrows, type-to-filter,
Esc) and note it. Matches the `MemberForm-Dark` artboard (`state = picker`).

Country list (constant, in this order — Nicaragua first, then the region):
NI Nicaragua +505 · CR Costa Rica +506 · HN Honduras +504 · SV El Salvador +503 · GT Guatemala
+502 · PA Panamá +507 · MX México +52 · US United States +1 · ES España +34. Country names are
shown in their own language (not translated). Keep the list easy to extend.

**Stored format:** one string, `"{dialCode} {number}"`, e.g. `"+505 8590 4417"`. Normalize the
number part to digits and single spaces (keep what the user typed for grouping, strip other
characters). The API caps the whole string at **20 characters**: validate that on the
combined value. An empty number means no phone (`null`), whatever the country.

**Reading an existing phone (edit):** if it starts with one of the dial codes, select that
country (longest match first, so `+1` doesn't steal `+1x…` codes added later) and put the rest
in the number field. If it doesn't (old or hand-entered data), select an extra **"Other"**
option (no dial code, tag `—`) and put the whole string in the number field unchanged, so
saving without touching it doesn't alter the value. New members default to Nicaragua.

### Birth date

A date input with a calendar button (`CalendarIcon`), showing the date in the UI locale's order
(`mm / dd / yyyy` in English, `dd / mm / yyyy` in Spanish). Prefer HeroUI v3's
`DatePicker`/`DateField` (with `@internationalized/date`) if available in 3.2.x; otherwise
`<input type="date">` styled like the other fields — note which. Send `"YYYY-MM-DD"`. No future
dates; nothing before 1900.

### Validation and errors

Schema (`_lib/member-schema.ts`, shared by the form and the server actions; messages are i18n
keys, not English):

| Field | Rule | Message (en / es) |
| --- | --- | --- |
| name | required, trimmed 1–255 | "Enter the member's name." / "Escribe el nombre del miembro." |
| email | optional; valid email | "Enter a valid email address." / "Escribe un correo válido." |
| email | 409 from the API | "Another member already uses this email." / "Otro miembro ya usa este correo." |
| phone | optional; combined ≤ 20 chars; digits/spaces only in the number | "Enter a shorter phone number." / "Escribe un número más corto." · "Use only numbers." / "Usa solo números." |
| address | optional; ≤ 255 | "Keep the address under 255 characters." / "La dirección debe tener menos de 255 caracteres." |
| birthDate | optional; valid, not in the future, ≥ 1900 | "Enter a valid date." / "Escribe una fecha válida." |

- Validate on submit, then re-validate a field on change once it has shown an error (no errors
  while typing in an untouched form).
- Invalid fields: `--danger` border, `aria-invalid`, and the message below (13px, danger, small
  `ExclamationCircleIcon`) linked with `aria-describedby`; the field's helper text is replaced
  by the error.
- When the submit fails (client or server), show the alert at the top of the card
  (`role="alert"`, danger tint background, danger text, `ExclamationCircleIcon`): **"This member
  wasn't saved"** + "Fix the {count, plural, one {field} other {# fields}} marked below and try
  again." ("No se guardó el miembro" / "Corrige {count, plural, one {el campo marcado} other {los
  # campos marcados}} abajo y vuelve a intentarlo."). For a non-field error (network, 429, 5xx)
  the second line is the `formError` text instead. Move focus to the alert (or the first invalid
  field) after a failed submit. See `MemberForm-Errors`.

### Saving

- **New:** POST with only the filled fields (omit empty optional ones) → redirect to
  `/members/{id}?saved=created`.
- **Edit:** PATCH with **only the fields that changed**; a cleared optional field is sent as
  `null`. Nothing changed → just go back to `/members/{id}` (no request, no toast). Success →
  `/members/{id}?saved=updated`.
- Leaving with unsaved changes needs no confirmation for now (note if you think it should).

**Done when:** `MemberForm` (`new`), `MemberForm-Edit`, `MemberForm-Errors` and `MemberForm-Dark`
are matched at 1440; fields stack at 390; adding a member lands on its detail page with "Member
added"; editing sends a PATCH with only the changed fields; a duplicate email shows the email
error; an existing phone without a known code round-trips unchanged; Spanish strings pass
`messages/parity.ts`.

## Stage 5: Docs

- `CLAUDE.md` → *Overview*: members has list, detail and add/edit.
- Mark the stages above done with their commits and finish *Decisions and deviations*.
- In `MEMBERS-LIST.md`, close Stage 3 if it's still open and note that its "Open" links now
  reach the detail page.
