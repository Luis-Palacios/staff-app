# User admin actions: role and ban on the user page

Implementation spec for **user admin actions** (`/users/[id]`, Account card). Cross-repo rules:
`../docs/specs/user-admin-actions.md` (workspace folder `members-management/docs/specs/`), referred
to as *rule N*.

- A caller with `user: set-role` can change a user's role; with `user: ban` they can ban (reason,
  optional expiry in days) and unban.

**Decided:** no new design. The controls sit under the Account card's fields and reuse the role
`Select`, `ConfirmDialog`, `Modal` and `SavedToast` already used by `AssignPendingRole` and the
member link actions.

**Depends on the API:** `auth-server/docs/USER-ADMIN-ACTIONS-HANDOFF.md` (done): the
`adminAccounts: manage` permission and the guard hook.

Branch **`user-admin-actions`**. Each stage lints (`pnpm lint`) and type-checks
(`pnpm exec tsc --noEmit`).

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. Permission type, error codes, role / ban / unban controls, copy | [x] | see `git log` |

### Decisions and deviations

- Calls go from the browser to better-auth (`authClient.admin.setRole / banUser / unbanUser`) with
  the session cookie, like `AssignPendingRole`; there is no server action (rule 3). The UI hides
  what the caller can't do, auth-server's guard is the real check.
- `userAccountAccess()` in `lib/auth/permissions.ts` decides which controls show: none on your own
  row (rule 6); the `admin` option only with `adminAccounts: manage` (rule 5).
- **Not hidden on admin accounts:** this app has no role → permission map and checks no role names
  (roles-and-permissions rule 1), so it can't tell that the target is an admin. An elder sees the
  controls on an admin and gets "Only an admin can change or ban an admin account" from the guard.
  Hiding them would need auth-server to ship a flag on the user; not done.
- Admin still asks for confirmation (as `AssignPendingRole` does). Unban asks too; ban has its own
  dialog (reason, length: until unbanned / 1 / 7 / 30 days).
- The Account card also shows the ban reason and end date while the user is banned.
- Error codes mapped in `useAuthErrorMessage`: `YOU_CANNOT_CHANGE_YOUR_OWN_ROLE`,
  `YOU_CANNOT_BAN_YOURSELF`, `YOU_CANNOT_ASSIGN_ADMIN_ROLE`, `YOU_CANNOT_MANAGE_ADMIN_ACCOUNTS`, `BANNED_USER` (a banned user
  signing in; better-auth answers 403), and
  better-auth's two `YOU_ARE_NOT_ALLOWED_TO_*` ones.
- Not exercised in a browser: no test sign-in was available in this session. Checked: `pnpm lint`
  (only an existing warning in `member-form.tsx`), `pnpm exec tsc --noEmit`. Still to check by hand,
  as admin and as elder: change a role, ban with and without reason/expiry, unban, the Admin
  confirmation, the guard messages (elder on an admin, own row has no controls), light/dark,
  1440 / 1024 / 390, English and Spanish.

## Copy

Namespaces `UserAccountActions` (new, in `CLIENT_NAMESPACES`), `UserDetail` (ban reason / end) and
`AuthErrors` (five new messages), in `messages/en.json` and `messages/es.json`.
