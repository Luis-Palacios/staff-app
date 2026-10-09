import { Figtree, Inter, Newsreader } from "next/font/google";

export const fontSans = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const fontDisplay = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

/**
 * Wordmark only. Loaded as the variable font (no `weight` list) because the
 * wordmark is drawn at weight 650, which the static 600/700 files can't render.
 */
export const fontLogo = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
