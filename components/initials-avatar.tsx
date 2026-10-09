import { tv } from "tailwind-variants";

// First letter of the first and last word: "Marco Antonio Pérez" → "MP".
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";

  return (first + last).toUpperCase();
}

const avatar = tv({
  base: "flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-soft-foreground",
  variants: {
    size: {
      sm: "size-9 text-[12.5px]",
      md: "size-[38px] text-[13px]",
      lg: "size-16 text-xl",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

// Decorative: the name always sits next to it, so it's hidden from screen
// readers rather than read out as two stray letters.
export function InitialsAvatar({
  name,
  size,
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={avatar({ size, className })}>
      {initialsOf(name)}
    </span>
  );
}
