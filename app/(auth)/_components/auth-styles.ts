// Shared classes for the auth screens (the Sign in artboards). HeroUI's own
// styles sit in a CSS layer below Tailwind utilities, so these win without
// !important. Sizes restate their md: value where HeroUI sets one.

// The column every screen fills: heading, fields, button, footer line.
export const authStack = "flex flex-col gap-[22px]";

export const authLabel = "text-sm font-semibold text-heading";

export const authInputGroup = "h-[46px] w-full";

export const authInput = "px-3.5 text-[15px] sm:text-[15px]";

// Full-width 48px primary or outline action.
export const authButton = "h-12 text-[15.5px] font-semibold md:h-12";

// Centered muted line under the button ("Don't have an account? Sign up").
export const authFooterLine = "text-center text-[14.5px] text-muted";
