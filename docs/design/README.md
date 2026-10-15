# Design: tokens, handoffs and sync

How design decisions get from the design canvases into this app, and how the app stays the
single source of truth for the ekklesiaio brand.

## Who owns what

| What | Where | How it changes |
| --- | --- | --- |
| **Design tokens** (brand colors, fonts, display sizes, radii, shadows, light/dark theme) | `tokens/*.json` in this repo | A PR. **This is the master copy.** |
| Generated CSS | `styles/brand.css`, `styles/theme.css` | `pnpm tokens`. Never edited by hand. |
| Everything else in the stylesheet (imports, focus rule, button radius, `@theme inline`) | `styles/globals.css` | Hand-edited, but no color or size literals |
| Visual reference: brand rules, type scale, component previews | [ekklesiaio Design System](https://claude.ai/artifact/3cQCVY9F8FWnLpggLknxh9) | Re-synced from `tokens/` after a token change merges |
| Screens and flows | [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1) · [Landing canvas](https://claude.ai/artifact/Ap3dfFe1QwaRd1DSjKLc6s) | Design sessions |
| What to build for a feature | `docs/design/<FEATURE>.md`, started from [`HANDOFF-TEMPLATE.md`](HANDOFF-TEMPLATE.md) | One spec per feature |

**If they disagree, `tokens/` wins.** The design system and the canvases get re-synced to match
it, not the other way round.

## The tokens

```
tokens/
  brand.json          brand primitives → styles/brand.css (Tailwind v4 @theme)
  themes/light.json   HeroUI + custom semantic variables, light → styles/theme.css
  themes/dark.json    the same, dark                            → styles/theme.css
  build.mjs           the generator (no dependencies)
```

- **Format:** [W3C Design Tokens (DTCG)](https://www.designtokens.org/). Each token has `$type`,
  `$value` and usually a `$description`, which becomes the comment in the CSS.
- **Brand names map to Tailwind:** `color.navy-900` → `--color-navy-900` → `bg-navy-900`,
  `text.display-xl` → `--text-display-xl` (+ `--line-height` / `--letter-spacing`).
- **Theme names are the CSS variable names** HeroUI v3 reads (`background`, `accent`,
  `field-border`, …) plus ours (`heading`, `eyebrow`, `subtle`, `rail`, `segment*`, …).
- **Aliases:** a theme value can point at a brand color, `"{color.navy-900}"`. The build writes
  the literal value into the CSS, with the token name in a comment.
- Some semantic values stay literal on purpose (white, the status greens and reds, alpha tints).
  The brand file deliberately has no `color.muted`, `color.surface`, `color.danger`, `color.field`
  or `color.subtle`, because HeroUI already owns those utility names (see the header of
  `styles/brand.css`).

### Changing or adding a token

1. Edit the JSON in `tokens/`. Keep or write the `$description`: say where the token is used.
   A new semantic token goes in **both** `themes/light.json` and `themes/dark.json`.
2. If components need a Tailwind utility for a new semantic token, add it to the `@theme inline`
   block in `styles/globals.css` (e.g. `--color-segment: var(--segment)`).
3. Run `pnpm tokens`, check the diff of `styles/brand.css` / `styles/theme.css`, then
   `pnpm lint` and `pnpm exec tsc --noEmit`.
4. Commit the JSON and the generated CSS **together**. `pnpm tokens --check` fails if they are
   out of step (use it before committing, or in CI later).
5. After the change merges, re-sync the design system and the landing page (below).

### Rules

- **No color, font-stack, radius or shadow literals in components or `globals.css`.** Use a
  token; if none fits, add one. Raw brand colors (`bg-navy-900`, `text-gold-500`) only where the
  look is the same in both themes (the rail); page content uses semantic tokens.
- **No component-level `dark:` overrides** unless a token can't express it. Usually it means a
  token is missing.
- **Gold never carries text on a light ground.** Gold text is `--eyebrow` (gold-800) on light, and
  `--warning-soft-foreground` on gold tints. `--focus` is gold-800 in light for the same reason
  (gold-500 is ~1.7:1 on paper).
- **Status is never color alone:** `StatusBadge` always shows a dot and a word.
- Check contrast in both themes when you change a color: text 4.5:1, borders/focus/icons 3:1.

## Feature workflow

1. **Design.** In a Claude session opened on the [Staff App canvas](https://claude.ai/artifact/PLs9gdHVcigkRSAWJrsKs1),
   add the feature's boards on their own page, light and dark, with every state (empty, loading,
   error, dialogs). The canvas uses the ekklesiaio Design System's tokens.
2. **Handoff.** Ask for a spec at `docs/design/<FEATURE>.md` from
   [`HANDOFF-TEMPLATE.md`](HANDOFF-TEMPLATE.md). Its **Token changes** table lists anything new or
   changed in `tokens/`; "None" is the normal case.
3. **Implement.** Claude Code works through the spec stage by stage on a feature branch, one
   commit per stage. Token changes go first, in their own stage.
4. **Design review.** Compare the running feature with the boards listed in the spec, using the
   review checklist at the end of the template, and record follow-ups in the spec's progress log.
5. **Sync** if tokens changed.

## Keeping the design system and the landing page in sync

`tokens/` here is the master. Two copies follow it.

### ekklesiaio Design System (and the canvases' theme)

After a token change merges, open a Claude session and ask:

> Re-sync the ekklesiaio Design System from staff-app `tokens/`, then update the Staff App and
> Landing canvases to the new version.

The sync converts `tokens/*.json` into the design system's own `tokens.json` (its format is a
list per family, not DTCG), keeps its usage notes, type scale and component previews, lists any
token that disappeared before removing it, and re-installs the result in both canvases. Canvas
boards drawn before the change keep their literal colors until they are redrawn.

### Landing page

**Pending.** `../landing-page/brand/theme.css` is still the hand-edited original that
`styles/brand.css` was first copied from. The next step makes it a generated copy of
`tokens/brand.json` (brand primitives only; the landing page has no dark theme or HeroUI
variables). Until then, a brand color change has to be made in both places.

## Other design docs here

Feature specs and their history: `BRAND-RESTYLE.md`, `MEMBERS-LIST.md`,
`MEMBER-DETAIL-AND-FORM.md`, `SMALL-GROUPS.md`, `ACCOUNT-MENU-AND-LANGUAGE.md`,
`MINISTRY-CHURCH-CONTEXT.md`, `dashboard-layout.md`. They describe what was built at the time;
where one says to edit `brand.css` or the theme block in `globals.css`, read that as "edit
`tokens/` and run `pnpm tokens`".
