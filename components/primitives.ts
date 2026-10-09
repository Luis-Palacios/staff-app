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
      md: "text-[38px] leading-[1.1]",
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
// just muddy the border.
export const card = tv({
  base: "rounded-card border border-border bg-surface shadow-[0_1px_2px_rgb(11_35_65/0.05)] dark:shadow-none",
});
