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

/** Wordmark only. */
export const fontLogo = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["600", "700"],
});
