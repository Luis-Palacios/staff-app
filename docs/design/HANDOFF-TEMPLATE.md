# [Feature]: [screens in a few words]

<!--
Template for a feature spec (a design handoff). Copy to docs/design/<FEATURE>.md, fill it in,
delete what doesn't apply and these comments. See docs/design/README.md for the workflow.
-->

Implementation spec for **[feature]** ([sidebar location], `[/route]`), which is [a stub / new /
being changed] today:

- [what the user gets, one bullet per screen or flow].

**Decided:** [product decisions already made, so the implementer doesn't re-open them].

**Depends on the API:** [`membership-management/docs/...` or "nothing new"]. If a stage starts
before the API is ready, note it and stub nothing in committed code.

Work through it **stage by stage**, one reviewable commit per stage, on the **`[branch]`** branch.
Each stage must lint (`pnpm lint`), type-check (`pnpm exec tsc --noEmit`) and work in light and
dark, at 1440 / 1024 / 390, in English and Spanish, before the next one starts. After each stage,
write a short summary of what changed and anything that differs from the canvas in the progress
log below.

- **Design (source of truth for look):** [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
  page "[page name]".
- **Boards:** `[Board-Name]` ([state]), `[Board-Name-Dark]` ([state]), …
- **Design system:** [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9),
  synced [YYYY-MM-DD].

## Progress (handoff log)

| Stage | Status | Commit |
| --- | --- | --- |
| 1. [Token changes, if any] | ⬜ | |
| 2. [API client, types and server actions] | ⬜ | |
| 3. [Screen] | ⬜ | |
| N. Design review fixes | ⬜ | |

### Decisions and deviations

- [Anything decided during implementation, or where the build intentionally differs from the
  canvas, and why.]

## Token changes

"None" is the normal case: the feature only uses existing tokens. Otherwise list every change;
they are made in `tokens/`, built with `pnpm tokens`, and land in their own first stage.

| Token | File | Light | Dark | Why |
| --- | --- | --- | --- | --- |
| `[name]` | `themes/*.json` | `[value or {alias}]` | `[value]` | [where it's used] |

New Tailwind utilities needed (`@theme inline` in `globals.css`): [none / list].

## The API

Endpoints, request/response shapes, errors (HTTP status → message key), permissions.

## Stage N: [screen] (`[/route]`)

**Files:** `[app/(app)/.../page.tsx]`, `[_components/...]`.

### [Part of the screen]

- Layout and components to reuse (`StaffAppPageHeader`, `StatusBadge`, `card()`, `dataTable()`,
  HeroUI compound components).
- Exact behavior: interactions, validation rules, what happens after save, focus target after
  each action.

### States

Empty, loading (skeleton), error, permission-denied, closed/read-only, as the boards show them.

## Copy

All new UI text, both languages (see "Adding UI text" in `CLAUDE.md`).

| Namespace.key | English | Español |
| --- | --- | --- |
| `[Ns].[key]` | [EN] | [ES] |

## Not in this spec

- [Deliberately left out, and where it will be handled.]

## Design review checklist

Run after implementation, against the boards listed above. Record findings in the progress log.

- [ ] Every board matches in light and dark: layout, spacing, type, states.
- [ ] 1440 / 1024 / 390: nothing clipped, nothing scrolls sideways; list pages switch table → cards
      below `md`.
- [ ] No color, font, radius or shadow literals in the changed files
      (`git diff main --name-only | xargs grep -nE '#[0-9a-fA-F]{3,8}\b|rgb\('`), and no new
      `dark:` overrides a token could replace.
- [ ] Token changes (if any) are in `tokens/`, `pnpm tokens --check` passes.
- [ ] Gold never carries text on a light ground; status shows a dot and a word.
- [ ] Focus ring visible on every control; keyboard order and focus after dialogs make sense.
- [ ] English and Spanish both fit; no hard-coded strings (`react/jsx-no-literals` is clean).
- [ ] `pnpm lint` and `pnpm exec tsc --noEmit` pass.
