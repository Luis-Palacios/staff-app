# Member sex: form field, detail and My profile

Implementation spec for **member sex** (Members, `/members/new`, `/members/{id}/edit`,
`/members/{id}`; My profile, `/users/me`), which doesn't exist today:

- the member form gets an optional **Sex** choice, **Male** / **Female**, next to Birth date;
- the *Contact & personal* card shows a **Sex** row after Birth date, on the member detail page
  and on My profile (both use `MemberContactCard`).

**Decided:** see the cross-repo spec `../docs/specs/member-sex.md` (workspace
`members-management/docs/specs/`). In short: only `male` / `female`, optional on create and
edit, no list column, no filter, not used by reports. Existing members show *Not provided*.

**Depends on the API:** `membership-management/docs/MEMBER-SEX-API-HANDOFF.md` (stages 1–2:
`sex` on `MemberDetail`, accepted by POST and PATCH). If a stage starts before the API is ready,
note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the **`member-sex`**
branch. Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in
light and dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After
each stage, write a short summary of what changed and anything that differs from the canvas in
the progress log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "Members".
- **Boards:** `MemberForm` (`variant` new/edit, `state` default/errors), `MemberForm-Edit`
  (Female selected), `MemberForm-Errors`, `MemberForm-Dark`, `MemberDetail`,
  `MemberDetail-Dark`, `MyProfile`, `MyProfile-Dark`. Read them with the Artifact tool's `read`
  and `path: "project/<Name>.dc.html"`.
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  unchanged.

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. API types, schema and server actions | ✅ | |
| 2. Form field | ✅ | |
| 3. Detail and My profile row | ✅ | |
| 4. Design review fixes | ⬜ | |

### Decisions and deviations

- Stage 1 type-checks only together with stage 2 (`MemberFormValues` now requires `sex`, which
  the form must supply); `createMemberAction` needed no cast.
- Stage 2's commit also carries the `MemberContactCard` message keys (messages files are shared).
- Not yet checked visually (light/dark, 1440/1024/390, canvas boards) or against the live API;
  stage 4 is still open.

## Token changes

None. The segmented control reuses `bg-segment` and the `segmentButton` treatment from
`components/status-tabs.tsx` / `components/theme-switch.tsx`.

New Tailwind utilities needed: none.

## The API

No new endpoint. `membership-management` adds one field:

- `MemberDetail.sex: "male" | "female" | null` on `GET /members/{id}`, `POST /members` and
  `PATCH /members/{id}` responses.
- `POST /members` accepts an optional `sex`; `PATCH /members/{id}` accepts `sex` and treats
  `null` as "clear".
- Not on `MemberSummary` (`GET /members`) or `Me`.
- An invalid value is a 422; the form can't produce one, so the existing generic
  `getApiErrorMessage()` path is enough.

## Stage 1: types, schema and server actions

**Files:** `api/members-api/types.ts`, `app/(app)/members/_lib/member-schema.ts`,
`app/(app)/members/_actions/member-actions.ts`, `app/(app)/members/[id]/edit/page.tsx`.

- `types.ts`: `export type MemberSex = "male" | "female";` `MemberDetail.sex: MemberSex | null`;
  `MemberInput.sex?: MemberSex | null`.
- `member-schema.ts`: add `"sex"` to `MEMBER_FIELDS` (so `MemberFormValues` gets it as a string,
  `""` meaning not provided) and update the "five fields" comment. In `memberSchema`:
  `sex: z.enum(["", "male", "female"], { error: "sexInvalid" satisfies MemberErrorKey })`, and
  add `"sexInvalid"` to `MemberErrorKey`. It can't happen from the UI; it guards the server
  action.
- `createMemberAction`: add `...(sex && { sex })` like the other optional fields. Make the
  `MemberInput` typing hold without a cast if you can (the enum narrows `""` out once checked);
  if a cast is needed, keep it to that one line and say why.
- `updateMemberAction`: no change needed; `""` already becomes `null`. Confirm it type-checks.
- Edit page: `initial` gets `sex: member.sex ?? ""`.

## Stage 2: form field (`/members/new`, `/members/{id}/edit`)

**Files:** `app/(app)/members/_components/member-form.tsx`, new
`app/(app)/members/_components/sex-field.tsx` (client), `messages/en.json`, `messages/es.json`.

### Layout

- In the **Personal** fieldset, Birth date and Sex share a row:
  `grid grid-cols-1 gap-5 sm:grid-cols-2`. Birth date loses its `sm:w-1/2` and fills its cell.
  On phones they stack, Birth date first. Address stays full width above them.
- The fieldset title changes to "Address, birthday and sex" (`personalTitle`, both languages).

### The control

- A two-option segmented control, **Male** then **Female**, the full width of its cell, each
  option half (`grid grid-cols-2`), height 40px to line up with the Birth date input. Reuse the
  `ToggleButtonGroup` / `ToggleButton` segmented treatment from `StatusTabs` (`bg-segment`
  ground, raised selected segment, `segmentButton` classes) rather than restyling.
- Label "Sex" above it in the same style as the other field labels (`text-[13px] font-semibold
  text-heading`), tied to the group with `aria-labelledby`. Help text "Optional." below, like
  Birth date.
- **Optional and clearable:** `selectionMode="single"` **without** `disallowEmptySelection`, so
  clicking the selected option clears it. Nothing is selected on Add; Edit preselects the stored
  value.
- `sex` lives in the form's `TextState` like the text fields (`""` | `"male"` | `"female"`), is
  part of `currentValues()`, and of `original` in the edit diff, so changing only Sex sends a
  PATCH with only `sex`, and clearing it sends `"sex": null`.
- Disabled while `isPending`, like every other field. Keyboard: Tab reaches the group, arrows
  move between options, Space/Enter toggles; the focus halo shows on the focused option.
- The control never shows a field error (`sexInvalid` is a server-side guard), but give
  `errors.sexInvalid` copy anyway so the key type stays complete.

## Stage 3: detail and My profile (`/members/{id}`, `/users/me`)

**Files:** `app/(app)/members/[id]/_components/member-contact-card.tsx`, messages.

- One more `Field` after Birth date, icon `UserIcon` (heroicons 24 outline, `strokeWidth={1.7}`
  like the others), label `t("sex")`, value `t("sexMale")` / `t("sexFemale")`, or the existing
  *Not provided* when `null`.
- Same component serves both pages, so both get the row (plain on the detail page,
  `bleed` on My profile). Nothing else changes on either page.

### States

- No value: *Not provided* in `text-subtle`, like the other empty fields.
- My profile stays read-only (no edit link), unchanged.

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `MemberForm.personalTitle` (changed) | Address, birthday and sex | Dirección, cumpleaños y sexo |
| `MemberForm.sex` | Sex | Sexo |
| `MemberForm.sexHelp` | Optional. | Opcional. |
| `MemberForm.sexMale` | Male | Masculino |
| `MemberForm.sexFemale` | Female | Femenino |
| `MemberForm.errors.sexInvalid` | Pick Male or Female. | Elige Masculino o Femenino. |
| `MemberContactCard.sex` | Sex | Sexo |
| `MemberContactCard.sexMale` | Male | Masculino |
| `MemberContactCard.sexFemale` | Female | Femenino |

`MemberForm` is already a client namespace; if `SexField` calls `useTranslations("MemberForm")`
nothing changes in `CLIENT_NAMESPACES`. `MemberContactCard` is a Server Component; keep it that
way. Commit the regenerated `messages/en.d.json.ts`.

## Not in this spec

- A Sex column or filter on the Members list (`MemberSummary` doesn't carry it).
- Showing sex in groups, reports, the dashboard or the user pages.
- Importing sex from the legacy assimilation DB.

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: Birth date and Sex side by side at `sm` and up, stacked on phones;
      nothing clipped, nothing scrolls sideways.
- [ ] Add: nothing selected; select, clear by clicking again, save: stored as null.
- [ ] Edit: preselected; change only Sex sends a PATCH with only `sex`; clearing sends `null`.
- [ ] Detail and My profile show the row in both languages, *Not provided* when empty.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Focus ring visible on each segment; keyboard order Address → Birth date → Sex → Cancel.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
