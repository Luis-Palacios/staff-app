# Edit own profile: edit form on My profile

Implementation spec for **edit own profile** (account menu › My profile, `/users/me`, new
`/users/me/edit`). Cross-repo rules: `../docs/specs/edit-own-profile.md` (workspace folder
`members-management/docs/specs/`), referred to as *rule N*.

- A signed-in user with a linked member can edit their `name`, `phone`, `address`, `birthDate` and
  `sex` from My profile.

**Decided:** the form is `MemberForm` (same fields, validation and phone/sex controls as Edit
member) with `own` set and no email field (rule 4). No new design: the canvas has no board for it,
so it looks like Edit member.

**Depends on the API:** `membership-management/docs/EDIT-OWN-PROFILE-API-HANDOFF.md` (done) and
auth-server's `ownProfile: update` (done).

Branch **`edit-own-profile`**. Each stage lints (`pnpm lint`) and type-checks
(`pnpm exec tsc --noEmit`).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Permission type, API client, server action | [x] | see `git log` |
| 2. Edit page, form `own` mode, Edit link, copy | [x] | see `git log` |

### Decisions and deviations

- API types are hand-written here (no generation step), so "regenerate" meant adding
  `OwnMemberInput` (`MemberInput` without `email`) and `updateMyMember()` to `api/members-api/`.
- `updateMyMemberAction` checks `ownProfile: update`, validates with `memberChangesSchema` minus
  `email` (zod drops unknown keys, so an email can't reach the API), sends `null` for empty optional
  fields, then redirects to `/users/me?saved=updated` (the existing "Changes saved" toast).
- `MemberForm` with no `memberId` and `own` calls that action; `canEditEmail={false}` hides the
  email field. Edit member is unchanged.
- `/users/me/edit` is a 404 without `ownProfile: update` or without a linked member (rule 2). It
  takes no id from the URL; it loads the member from `GET /me`, as My profile does.
- The Edit link is in the contact card (`variant="self"`), shown with `ownProfile: update`. The
  footer note changes to say what can be edited and to ask an admin or elder for the email.
  Without the permission (`pending`) the old read-only note stays.
- Not exercised in a browser: no test sign-in was available in this session. Checked: `pnpm lint`,
  `pnpm exec tsc --noEmit`, the running API (:8000) lists `/me/member`. Still to check by hand:
  edit and save each field, clear the optionals, light/dark, 1440 / 1024 / 390, English and Spanish,
  and a user without a linked member or with role `pending` (no link, `/users/me/edit` is a 404).

## Copy

| Namespace.key | English | Español |
| --- | --- | --- |
| `MemberFormPage.ownEditTitle` | Edit my profile | Editar mi perfil |
| `MemberFormPage.ownEditDescription` | Update your name, phone, address, birthday and sex. Your email can only be changed by an admin or elder. | Actualiza tu nombre, teléfono, dirección, fecha de nacimiento y sexo. Tu correo solo puede cambiarlo un administrador o anciano. |
| `MyProfilePage.contactFooterEditable` | You can edit your name, phone, address, birthday and sex. To change your email or anything else, ask an admin or elder. | Puedes editar tu nombre, teléfono, dirección, fecha de nacimiento y sexo. Para cambiar tu correo o cualquier otro dato, pide a un administrador o anciano. |

## Not in this spec

Profile photo, saving the language to the profile, change password or email (auth-server), an
audit trail.
