import { tv } from "tailwind-variants";

// Display heading in Newsreader. `sm` is a card title, `md` a page title
// (the <h1> in StaffAppPageHeader), `lg` a hero-sized heading.
export const title = tv({
  // Leading sits after each size: tailwind-merge drops a leading-* that comes
  // before a text-* size, because Tailwind font sizes set their own line height.
  base: "font-display font-medium tracking-[-0.015em] text-heading",
  variants: {
    size: {
      sm: "text-2xl leading-[1.1]",
      md: "text-[30px] leading-[1.1] sm:text-[38px]",
      lg: "text-5xl leading-[1.1]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

// Muted body text under a heading.
export const subtitle = tv({
  base: "text-base text-muted",
});

// Content card surface. The hairline shadow is light-only: on navy it would
// just muddy the border. `interactive` is for a card that is itself a link:
// a hover border, plus the focus halo restated, because the shadow utilities
// here outrank the global halo (a base-layer rule). The dark: copy beats
// dark:shadow-none.
export const card = tv({
  base: "rounded-card border border-border bg-surface shadow-[0_1px_2px_rgb(11_35_65/0.05)] dark:shadow-none",
  variants: {
    interactive: {
      true: [
        "transition-colors hover:border-field-border",
        "focus-visible:shadow-[var(--shadow-focus)] dark:focus-visible:shadow-[var(--shadow-focus)]",
      ],
    },
  },
});
